import { expect } from 'chai';
import { simulateGameCommand } from '../../simulateCommand';
import { Game, INIT_GAME_STATE, BoardCell, Rune } from '../../Game';
import { clientGameCommand } from '..';
import { SpellCard } from '../../../Spell/Spell';
import { Card } from '../../../Card/Card';

function emptyBoard(): BoardCell[][] {
	return Array.from({ length: 6 }, (_, row) =>
		Array.from({ length: 6 }, (_, col): BoardCell => ({
			position: { row, col }, zoneId: '', glyphs: [], rune: null, hasCrux: false,
		}))
	);
}

const rune = (owner: 'light' | 'dark', flux: number): Rune => ({ owner, flux });

const rowSpell: SpellCard = { id: 's-row', name: 'Charge Row', shape: 'row3', effect: 'charge', forceCost: 2 };
const refill: SpellCard   = { id: 's-fill', name: 'Charge', shape: 'single', effect: 'charge', forceCost: 1 };
const deckCards: Card[]    = [{ id: 'c0', element: 'sun' }, { id: 'c1', element: 'sun' }];

function baseState(over: Partial<Game> = {}): Game {
	const board = emptyBoard();
	board[3][2].rune = rune('light', 1);
	board[3][3].rune = rune('light', 1);
	board[3][4].rune = rune('dark', 1);
	return {
		...INIT_GAME_STATE,
		id: 'spell-test',
		phase: 'main-turn',
		currentTurn: 'light',
		options: { ...INIT_GAME_STATE.options, spells: true },
		board,
		zones: [],
		rift: 0,
		deck: deckCards,
		spellDisplay: [rowSpell],
		spellDeck: [refill],
		spellDiscard: [],
		...over,
	};
}

function cast(state: Game, spellId: string, anchor: { row: number; col: number }) {
	return simulateGameCommand(state, clientGameCommand('CastSpell', { player: 'light', spellId, anchor }));
}

describe('CastSpell', () => {
	it('charges only the caster\'s runes in the footprint, leaving enemy/empty cells alone', () => {
		const result = cast(baseState(), 's-row', { row: 3, col: 3 });
		expect(result.ok, result.error?.message).to.equal(true);

		const b = result.state.board;
		expect(b[3][2].rune?.flux).to.equal(2); // light, charged
		expect(b[3][3].rune?.flux).to.equal(2); // light, charged
		expect(b[3][4].rune?.flux).to.equal(1); // dark, untouched
	});

	it('spends Force by sliding the Rift toward the opponent', () => {
		const result = cast(baseState({ rift: 1 }), 's-row', { row: 3, col: 3 });
		// Light pays 2 Force → Rift moves from +1 to −1.
		expect(result.state.rift).to.equal(-1);
	});

	it('consumes the cast Spell and refills the display', () => {
		const result = cast(baseState(), 's-row', { row: 3, col: 3 });
		const display = result.state.spellDisplay;
		expect(display.find(s => s.id === 's-row')).to.equal(undefined);
		expect(display.find(s => s.id === 's-fill')).to.not.equal(undefined);
		expect(result.state.spellDiscard.map(s => s.id)).to.include('s-row');
	});

	it('ends the turn (a full main action)', () => {
		const result = cast(baseState(), 's-row', { row: 3, col: 3 });
		expect(result.state.currentTurn).to.equal('dark');
	});

	it('rejects a cast with insufficient Force room', () => {
		// Light at −6 has only 1 step of room; the row Spell costs 2.
		const result = cast(baseState({ rift: -6 }), 's-row', { row: 3, col: 3 });
		expect(result.ok).to.equal(false);
	});

	it('rejects casting when spells are disabled', () => {
		const state = baseState({ options: { ...INIT_GAME_STATE.options, spells: false } });
		expect(cast(state, 's-row', { row: 3, col: 3 }).ok).to.equal(false);
	});

	it('rejects a Spell that is not in the display', () => {
		expect(cast(baseState(), 's-nope', { row: 3, col: 3 }).ok).to.equal(false);
	});
});
