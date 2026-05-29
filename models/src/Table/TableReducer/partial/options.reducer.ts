import { Table } from '../../Table';
import { TableEvent } from '../../TableEvent/TableEvent';

export function optionsReducer(event: TableEvent, state: Table): Table {
	switch (event.type) {
		case 'Options Changed':
			return { ...state, options: { ...state.options, ...event.payload.options } };

		default:
			return state;
	}
}
