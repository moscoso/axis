import express from 'express';
import { Server, Socket } from 'socket.io';
import http from 'http';
import { index as routes } from './routes';
import { Dealer, clientTableCommand } from 'axis-models';
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents } from './SocketEvents';
import { SocketEventController } from './controllers/SocketEventController';
import { BotRunner, botUserId } from './BotRunner';

type RoomID = string;

/** A fixed test room where seat 1 is pre-filled with a HeuristicBot. */
const BOT_TEST_ROOM: RoomID = 'bot-test';

export class GameServer {
	private static instance: GameServer;

	public static readonly DEFAULT_PORT: number = 3000;
	private port: number = GameServer.DEFAULT_PORT;
	private httpServer: http.Server;
	private socketServer: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents>;

	public dealerMap: Map<RoomID, Dealer> = new Map();
	public botRunners: Map<RoomID, BotRunner> = new Map();
	public connections: Set<Socket> = new Set();

	private constructor() {
		const expressApp = this.createApp();
		this.configPort();
		this.httpServer = this.createServer(expressApp);
		this.socketServer = this.createSockets(this.httpServer);
		GameServer.instance = this;

		const d = new Dealer('blackhole', this.getSocketServer());
		this.dealerMap.set('blackhole', d);

		this.bootstrapBotTestRoom();
	}

	/**
	 * Spins up a permanent {@link BOT_TEST_ROOM} with a HeuristicBot pre-seated
	 * in seat 1. A human can join seat 0 from the PWA and immediately play
	 * against the AI without any client-side changes. Pre-seating is done via
	 * a synthetic JoinTable command so the rest of the system sees a normal
	 * two-player table.
	 */
	private bootstrapBotTestRoom(): void {
		const dealer = new Dealer(BOT_TEST_ROOM, this.getSocketServer());
		this.dealerMap.set(BOT_TEST_ROOM, dealer);

		const runner = new BotRunner(dealer);
		this.botRunners.set(BOT_TEST_ROOM, runner);

		const id = botUserId('heuristic');
		runner.register(id);

		// Seat the bot, then record its side preference. Two commands because
		// side preference isn't part of JoinTable. Bot prefers 'dark' so the
		// human joining seat 0 can pick 'light' and go first in main-turn.
		dealer.executeTableCommand(
			clientTableCommand('JoinTable', {
				user: { id, name: 'Axis AI (Heuristic)', photoURL: '' }
			})
		);
		dealer.executeTableCommand(
			clientTableCommand('SelectSide', { userId: id, sidePreference: 'dark' })
		);

		console.log(`[GameServer] bot test room "${BOT_TEST_ROOM}" ready — bot in seat 1, join seat 0 to play`);
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
