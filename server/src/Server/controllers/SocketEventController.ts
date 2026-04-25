import { Server, Socket } from 'socket.io';
import { GameServer } from '../GameServer';
import { ActionController } from './ActionController';

export class SocketEventController {
	public static onConnect(socket: Socket) {
		console.log(`${socket.id} connected`);
		GameServer.getInstance().connections.add(socket);
		socket.join('blackhole');
		socket.on('SyncRequested', (payload: any) => {
			const d = GameServer.getInstance().dealerMap.get(payload.roomID);
			socket.emit('DeltaUpdate', {
				game:  d?.gameState,
				table: d?.tableState
			});
		});
		socket.on('restartGame', (payload: { roomID: string }) => {
			const dealer = GameServer.getInstance().dealerMap.get(payload.roomID);
			if (!dealer) {
				socket.emit('ServerError', `Dealer for roomID: ${payload.roomID} not found`);
				return;
			}
			dealer.restartGame();
		});
		socket.on('disconnect', () => SocketEventController.onDisconnect(socket));
		socket.on('pingLatency', (cb: any) => SocketEventController.onPingLatency(socket, cb));
		ActionController.addActionListeners(socket);
	}

	public static onDisconnect(socket: Socket) {
		GameServer.getInstance().connections.delete(socket);
		console.log(`${socket.id} disconnected`);
	}

	public static onPingLatency(socket: Socket, callback: any) {
		callback(Date.now());
	}

	public static register(server: Server) {
		server.on('connection', this.onConnect);
	}
}
