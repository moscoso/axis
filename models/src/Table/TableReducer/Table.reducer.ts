import { combineReducers, deepCopy } from '@moscoso/models';
import { Table } from '../Table';
import { TableEvent } from '../TableEvent/TableEvent';
import { optionsReducer } from './partial/options.reducer';
import { seatsReducer }  from './partial/seats.reducer';
import { statusReducer } from './partial/status.reducer';

export function tableReducer(event: TableEvent, state: Table): Table {
	const table: Table = deepCopy(state);
	return combineReducers(table, event, [
		optionsReducer,
		seatsReducer,
		statusReducer,
	]);
}
