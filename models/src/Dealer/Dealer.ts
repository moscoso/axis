import { Aggregate } from '@moscoso/models';
import { GameCommand, GameCommandFactory, GameCommandResult, GameEvent, INIT_GAME_STATE, gameReducer } from '../Game';
import { Game } from '../Game/Game';
import { TableCommand, TableCommandFactory, TableCommandResult, TableEvent, INIT_TABLE_STATE, tableReducer } from '../Table';
import { Table } from '../Table/Table';
import { DealerEmitter, DealerEvents, newDealerEmitter, RoomBroadcaster } from './DealerEmitter';
import { DEALER_TRIGGERS } from './DealerTrigger';

/**
 * The {@link Dealer} orchestrates both the {@link Table} and {@link Game}.
 * It executes commands, applies events, fires automatic triggers, and broadcasts updates.
 */
export class Dealer {
	private table = new Aggregate('_table', INIT_TABLE_STATE, tableReducer);
	private game  = new Aggregate('_game',  INIT_GAME_STATE,  gameReducer);
	private eventEmitter = newDealerEmitter();

	constructor(private roomId: string, private broadcaster?: RoomBroadcaster) {
		this.setupBroadcaster();
	}

	// ─── Table ───────────────────────────────────────────────────────────────────

	/** Current table state */
	public get tableState(): Table { return this.table.state; }

	/** Full event history for the current table session */
	public get tableEvents(): readonly TableEvent[] { return this.table.events; }

	/**
	 * Executes a {@link TableCommand}.
	 * Injects the current table state, applies resulting events, and runs any follow-up commands.
	 */
	public executeTableCommand(command: TableCommand<any>): TableCommandResult {
		command.params.table = this.tableState;

		const result = this.table.executeCommand(command);

		if (result.isSuccess) {
			const { commands, events } = result.value;
			commands.forEach(c => this.executeTableCommand(c));
			setImmediate(() => {
				this.eventEmitter.emit('TableUpdate', { events, table: this.tableState });
				this.triggerCommands(events);
			});
		} else {
			this.eventEmitter.emit('TableError', { command, error: result.error });
		}

		return result;
	}

	/** Resets the table to its initial state. */
	public resetTable(): void {
		this.table.reset();
	}

	// ─── Game ────────────────────────────────────────────────────────────────────

	/** Current game state */
	public get gameState(): Game { return this.game.state; }

	/** Full event history for the current game */
	public get gameEvents(): readonly GameEvent[] { return this.game.events; }

	/**
	 * Executes a {@link GameCommand}.
	 * Injects the current game state, applies resulting events, and runs any follow-up commands.
	 */
	public executeGameCommand(command: GameCommand<any>): GameCommandResult {
		command.params.game = this.gameState;

		const result = this.game.executeCommand(command);

		if (result.isSuccess) {
			const { commands, events } = result.value;
			commands.forEach(c => this.executeGameCommand(c));
			setImmediate(() => {
				this.eventEmitter.emit('GameUpdate', { events, game: this.gameState });
				this.triggerCommands(events);
			});
		} else {
			this.eventEmitter.emit('GameError', { command, error: result.error });
		}

		return result;
	}

	/** Resets the game to its initial state. */
	public resetGame(): void {
		this.game.reset();
	}

	// ─── Shared ──────────────────────────────────────────────────────────────────

	/** The typed event emitter */
	public get emitter(): DealerEmitter { return this.eventEmitter; }

	/**
	 * Checks each event against {@link DEALER_TRIGGERS} and fires any matching commands automatically.
	 * Accepts both table and game events.
	 */
	private triggerCommands(events: TableEvent[] | GameEvent[]): void {
		events.forEach(event => {
			DEALER_TRIGGERS.forEach(trigger => {
				const matches = trigger.on === '*' || (trigger.on as string[]).includes(event.type);
				const passes  = !trigger.if || trigger.if(this);
				if (!matches || !passes) return;

				trigger.effect?.(this);

				if (trigger.gameCommand) {
					const commandClass = GameCommandFactory.getType(trigger.gameCommand);
					if (commandClass) {
						this.executeGameCommand(GameCommandFactory.get(commandClass, { game: this.gameState }));
					}
				}

				if (trigger.tableCommand) {
					const commandClass = TableCommandFactory.getType(trigger.tableCommand);
					if (commandClass) {
						this.executeTableCommand(TableCommandFactory.get(commandClass, { table: this.tableState }));
					}
				}
			});
		});
	}

	private setupBroadcaster(): void {
		const handlers: [keyof DealerEvents, (payload: any) => void][] = [
			['GameUpdate',  payload => this.broadcast('GameUpdate',  payload)],
			['TableUpdate', payload => this.broadcast('TableUpdate', payload)],
			['GameError',   payload => console.warn('GameError',  payload)],
			['TableError',  payload => console.warn('TableError', payload)],
		];
		handlers.forEach(([event, handler]) => this.eventEmitter.on(event, handler));
	}

	private broadcast(event: keyof DealerEvents, payload: any): void {
		this.broadcaster?.to(this.roomId).emit(event, payload);
	}
}
