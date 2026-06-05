import { expect } from 'chai';
import { getSpellFootprint } from './Spell';
import { getForceRoom } from '../Selectors/SpellSelectors';
import { INIT_GAME_STATE } from '../Game/Game';

describe('getSpellFootprint', () => {
	it('covers the expected cells for each shape (centered anchor)', () => {
		const a = { row: 3, col: 3 };
		expect(getSpellFootprint('single', a)).to.deep.equal([{ row: 3, col: 3 }]);
		expect(getSpellFootprint('row3', a)).to.deep.equal([
			{ row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 },
		]);
		expect(getSpellFootprint('col3', a)).to.deep.equal([
			{ row: 2, col: 3 }, { row: 3, col: 3 }, { row: 4, col: 3 },
		]);
		expect(getSpellFootprint('x5', a)).to.have.deep.members([
			{ row: 3, col: 3 },
			{ row: 2, col: 2 }, { row: 2, col: 4 }, { row: 4, col: 2 }, { row: 4, col: 4 },
		]);
		// block4 anchors at its top-left.
		expect(getSpellFootprint('block4', a)).to.have.deep.members([
			{ row: 3, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 3 }, { row: 4, col: 4 },
		]);
	});

	it('clips cells that fall off the board', () => {
		// row3 anchored at the left edge loses its left cell.
		expect(getSpellFootprint('row3', { row: 0, col: 0 })).to.deep.equal([
			{ row: 0, col: 0 }, { row: 0, col: 1 },
		]);
		// x5 in the corner keeps only the anchor and the one in-board diagonal.
		expect(getSpellFootprint('x5', { row: 0, col: 0 })).to.have.deep.members([
			{ row: 0, col: 0 }, { row: 1, col: 1 },
		]);
	});
});

describe('getForceRoom', () => {
	const at = (rift: number) => ({ ...INIT_GAME_STATE, rift });

	it('is symmetric at center and shrinks as you approach the enemy edge', () => {
		expect(getForceRoom(at(0), 'light')).to.equal(7);
		expect(getForceRoom(at(0), 'dark')).to.equal(7);
		// Light pushes toward −8; sitting at −5 leaves only 2 steps before −7.
		expect(getForceRoom(at(-5), 'light')).to.equal(2);
		// Dark pushes toward +8; sitting at +5 leaves only 2.
		expect(getForceRoom(at(5), 'dark')).to.equal(2);
	});

	it('never goes negative', () => {
		expect(getForceRoom(at(-7), 'light')).to.equal(0);
		expect(getForceRoom(at(7), 'dark')).to.equal(0);
	});
});
