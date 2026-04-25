import { Seat, Table } from '../../Table';
import { TableEvent } from '../../TableEvent/TableEvent';

export function seatsReducer(event: TableEvent, state: Table): Table {
	switch (event.type) {
		case 'Player Joined': {
			const seats: Table['seats'] = [...state.seats];
			const emptyIndex = seats.indexOf(null);
			if (emptyIndex === -1) return state;
			const seat: Seat = { user: event.payload.user, sidePreference: null };
			seats[emptyIndex] = seat;
			return { ...state, seats };
		}

		case 'Player Left': {
			const seats: Table['seats'] = state.seats.map(s =>
				s?.user.id === event.payload.userId ? null : s
			) as Table['seats'];
			return { ...state, seats };
		}

		case 'Side Selected': {
			const { userId, sidePreference } = event.payload;
			const seats: Table['seats'] = state.seats.map(s =>
				s?.user.id === userId ? { ...s, sidePreference } : s
			) as Table['seats'];
			return { ...state, seats };
		}

		default:
			return state;
	}
}
