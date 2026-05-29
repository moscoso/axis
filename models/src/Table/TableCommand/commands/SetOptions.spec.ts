import { expect } from 'chai';
import { SetOptions } from './SetOptions';
import { OptionsChanged } from '../../TableEvent/TableEvent';
import { tableReducer } from '../../TableReducer/Table.reducer';
import { Table, INIT_TABLE_STATE } from '../../Table';
import { DEFAULT_OPTIONS } from '../../../Game/GameOptions';

function seatedTable(): Table {
	return {
		...INIT_TABLE_STATE,
		id: 't',
		seats: [{ user: { id: 'u1', name: 'P1', photoURL: '' }, sidePreference: null }, null],
		options: { ...DEFAULT_OPTIONS },
	};
}

describe('SetOptions command', () => {
	it('emits Options Changed with the supplied patch for a seated player', () => {
		const table = seatedTable();
		const result = new SetOptions('SetOptions', {
			table,
			userId: 'u1',
			options: { shiftGlyphs: false },
		}).execute();

		expect(result.isSuccess).to.equal(true);
		const events = result.value!.events;
		expect(events).to.have.length(1);
		expect(events[0]).to.be.instanceOf(OptionsChanged);
		expect(events[0].payload).to.deep.equal({ options: { shiftGlyphs: false } });
	});

	it('fails when the actor is not seated', () => {
		const table = seatedTable();
		const result = new SetOptions('SetOptions', {
			table,
			userId: 'stranger',
			options: { shiftGlyphs: false },
		}).execute();

		expect(result.isFailure).to.equal(true);
	});
});

describe('tableReducer — Options Changed', () => {
	it('merges the patch into table.options, leaving other options intact', () => {
		const table = seatedTable();
		const next = tableReducer(new OptionsChanged({ options: { shiftGlyphs: false } }), table);

		expect(next.options.shiftGlyphs).to.equal(false);
		expect(next.options.startOfTurnDraws).to.equal(table.options.startOfTurnDraws);
	});
});
