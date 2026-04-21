import { Table, TableStatus } from '../../Table';
import { TableEvent } from '../../TableEvent/TableEvent';

function deriveStatus(state: Table): TableStatus {
	return state.seats.every(s => s !== null) ? 'ready' : 'waiting';
}

export function statusReducer(event: TableEvent, state: Table): Table {
	switch (event.type) {
		case 'Player Joined':
		case 'Player Left':
			return { ...state, status: deriveStatus(state) };

		case 'Game Recorded':
			return { ...state, status: 'finished' };

		case 'Table Cleaned':
			return { ...state, status: deriveStatus(state) };

		default:
			return state;
	}
}
