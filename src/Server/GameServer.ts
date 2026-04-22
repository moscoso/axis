import express from 'express';
import { Server, Socket } from 'socket.io';
import http from 'http';
import { index as routes } from './routes';
import { Dealer } from 'axis-models';
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents } from './SocketEvents';
import { SocketEventController } from './controllers/SocketEventController';

type RoomID = string;

export class GameServer {
	private static instance: GameServer;

	public static readonly DEFAULT_PORT: number = 3000;
	private port: number = GameServer.DEFAULT_PORT;
	private httpServer: http.Server;
	private socketServer: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents>;

	public dealerMap: Map<RoomID, Dealer> = new Map();
	public connections: Set<Socket> = new Set();

	private constructor() {
		const expressApp = this.createApp();
		this.configPort();
		this.httpServer = this.createServer(expressApp);
		this.socketServer = this.createSockets(this.httpServer);
		GameServer.instance = this;

		const d = new Dealer('blackhole', this.getSocketServer());
		this.dealerMap.set('blackhole', d);
	}

	public static getInstance(): GameServer {
		if (!GameServer.instance) GameServer.instance = new GameServer();
		return GameServer.instance;
	}

	private createApp(): express.Application {
		const expressApp = express();
		expressApp.set('json spaces', 2);
		expressApp.set('Cache-control', 'no-cache');
		expressApp.use('/', routes);
		return expressApp;
	}

	private configPort(): void {
		const envPort = process.env.PORT;
		if (envPort && !isNaN(+envPort)) {
			this.port = +envPort;
		} else {
			this.port = GameServer.DEFAULT_PORT;
		}
	}

	private createServer(expressApp: express.Application): http.Server {
		return http.createServer(expressApp);
	}

	private createSockets(server: http.Server): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents> {
		return new Server(server, {
			cors: {
				origin: '*',
				methods: ['GET', 'POST']
			}
		});
	}

	public listen(): void {
		this.httpServer.listen(this.port, () => {
			console.log(`Running server on port ${this.port}`);
		});
		SocketEventController.register(this.socketServer);
	}

	rejoinRoom(tableID: string, socket: Socket) {
		socket.join(tableID);
	}

	public getSocketServer(): Server {
		return this.socketServer;
	}
}
