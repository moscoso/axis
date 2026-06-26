import { AppEvent, User, UserID } from '@moscoso/models';
import { PlayerSide } from '../../Player/Player';
import { GameOptions } from '../../Game/GameOptions';
import { SidePreference } from '../Table';

export const TABLE_EVENT_TYPES = [
	'Game Recorded',
	'Options Changed',
	'Player Joined',
	'Player Left',
	'Side Selected',
	'Table Cleaned',
] as const;

export type TableEventType = typeof TABLE_EVENT_TYPES[number];

abstract class TableEvents<P> extends AppEvent<TableEventType, P> {
	override payload: P;
	constructor(payload?: P) {
		super();
		this.payload = payload ?? {} as P;
	}
}

// ─── Game Recorded ───────────────────────────────────────────────────────────

type GameRecordedPayload = {
	lightId: UserID;
	darkId: UserID;
	winner: PlayerSide | null;
	reason: 'rift-break' | 'end-score' | null;
};
export class GameRecorded extends TableEvents<GameRecordedPayload> {
	override readonly type = 'Game Recorded';
}

// ─── Options Changed ─────────────────────────────────────────────────────────

type OptionsChangedPayload = { options: Partial<GameOptions> };
export class OptionsChanged extends TableEvents<OptionsChangedPayload> {
	override readonly type = 'Options Changed';
}

// ─── Player Joined ───────────────────────────────────────────────────────────

type PlayerJoinedPayload = { user: User };
export class PlayerJoined extends TableEvents<PlayerJoinedPayload> {
	override readonly type = 'Player Joined';
}

// ─── Player Left ─────────────────────────────────────────────────────────────

type PlayerLeftPayload = { userId: UserID };
export class PlayerLeft extends TableEvents<PlayerLeftPayload> {
	override readonly type = 'Player Left';
}

// ─── Side Selected ───────────────────────────────────────────────────────────

type SideSelectedPayload = { userId: UserID; sidePreference: SidePreference };
export class SideSelected extends TableEvents<SideSelectedPayload> {
	override readonly type = 'Side Selected';
}

// ─── Table Cleaned ───────────────────────────────────────────────────────────

export class TableCleaned extends TableEvents<{}> {
	override readonly type = 'Table Cleaned';
}

// ─── Union ───────────────────────────────────────────────────────────────────

export type TableEvent =
	GameRecorded |
	OptionsChanged |
	PlayerJoined |
	PlayerLeft |
	SideSelected |
	TableCleaned;
