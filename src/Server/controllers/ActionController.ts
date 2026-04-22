import { Socket } from 'socket.io';
import { GameServer } from '../GameServer';
import { gameCommand, tableCommand } from 'axis-models';
import { LogErrors } from '../decorator/LogErrors';

export class ActionController {
	@LogErrors
	public static gameAction(payload: any, socket: Socket) {
		const server = GameServer.getInstance();
		const dealer = server.dealerMap.get(payload.roomID);
		if (!dealer) {
			socket.emit('ServerError', `Dealer for roomID: ${payload.roomID} not found`);
			return;
		}
		const commandJSON = JSON.parse(payload.command);
		const command = gameCommand(commandJSON.name, commandJSON.params);
		const result = dealer.executeGameCommand(command);
		if (result.isFailure) {
			socket.emit('ServerError', `GameError: ${result.error}`);
		}
	}

	@LogErrors
	public static tableAction(payload: any, socket: Socket) {
		const server = GameServer.getInstance();
		const dealer = server.dealerMap.get(payload.roomID);
		if (!dealer) {
			socket.emit('ServerError', `Dealer for roomID: ${payload.roomID} not found`);
			return;
		}
		const commandJSON = JSON.parse(payload.command);
		const command = tableCommand(commandJSON.name, commandJSON.params);
		const result = dealer.executeTableCommand(command);
		if (result?.isFailure) {
			socket.emit('ServerError', `TableError: ${result.error}`);
		}
	}

	public static readonly handlers = [
		{ name: 'gameAction',  fn: ActionController.gameAction  },
		{ name: 'tableAction', fn: ActionController.tableAction }
	];

	public static addActionListeners(socket: Socket): void {
		ActionController.handlers.forEach((handler) => {
			socket.on(handler.name, (payload: any) => handler.fn(payload, socket));
		});
	}
}
