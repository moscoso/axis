import { Table, TableStatus } from '../../Table';
import { TableEvent } from '../../TableEvent/TableEvent';

function deriveStatus(state: Table): TableStatus {
	return state.seats.every(s => s !== null) ? 'ready' : 'waiting';
}

/**
 * Status is a pure function of seat occupancy. Any event that could change
 * which seats are filled re-derives it; everything else passes through.
 */
export function statusReducer(event: TableEvent, state: Table): Table {
	switch (event.type) {
		case 'Player Joined':
		case 'Player Left':
		case 'Table Cleaned':
			return { ...state, status: deriveStatus(state) };

		default:
			return state;
	}
}
