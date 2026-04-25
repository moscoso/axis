import { EventEmitter } from 'events';
import { GameCommand, GameEvent } from '../Game';
import { GameError } from '../Game/GameError/GameError';
import { Game } from '../Game/Game';
import { TableCommand, TableEvent } from '../Table';
import { TableError } from '../Table/TableError/TableError';
import { Table } from '../Table/Table';

export type DealerEvents = {
	GameError:   (payload: { command: GameCommand; error: GameError }) => void;
	GameUpdate:  (payload: { events: GameEvent[];  game: Game  }) => void;
	TableError:  (payload: { command: TableCommand; error: TableError }) => void;
	TableUpdate: (payload: { events: TableEvent[]; table: Table      }) => void;
};

/**
 * A typed wrapper around Node's {@link EventEmitter} scoped to {@link DealerEvents}.
 */
export interface DealerEmitter extends EventEmitter {
	on<K extends keyof DealerEvents>(event: K, listener: DealerEvents[K]): this;
	emit<K extends keyof DealerEvents>(event: K, ...args: Parameters<DealerEvents[K]>): boolean;
}

export const newDealerEmitter = (): DealerEmitter => new EventEmitter() as DealerEmitter;

/**
 * A minimal broadcasting interface that allows emitting events to a specific room.
 * Typically backed by a Socket.IO server instance.
 *
 * @example
 * broadcaster.to('room123').emit('GameUpdate', { events, game });
 */
export interface RoomBroadcaster {
	to(room: string): {
		emit(event: string, payload: any): void;
	};
}
