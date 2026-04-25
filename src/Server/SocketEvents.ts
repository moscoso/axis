import { GameEvent, Game, Table, TableEvent } from 'axis-models';

export interface ServerToClientEvents {
	ServerError: (message: string) => void;
	GameUpdate: (a: GameUpdate) => void;
	TableUpdate: (a: TableUpdate) => void;
}

export interface ClientToServerEvents {
	gameAction: () => void;
	tableAction: () => void;
}

export interface InterServerEvents {
	ping: () => void;
}

export interface SocketData {
	name: string;
	age: number;
}

export interface GameUpdate  { events: GameEvent[];  game: Game; }
export interface TableUpdate { events: TableEvent[]; table: Table;    }
