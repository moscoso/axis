import { expect } from 'chai';
import { riftReducer } from './rift.reducer';
import { Game, INIT_GAME_STATE, BoardCell } from '../../Game';
import { RuneInscribed } from '../../GameEvent/GameEvent';
import { Element } from '../../../Element/Element';
import { Glyph } from '../../../Glyph/Glyph';
import { Zone } from '../../../Zone/Zone';

function emptyBoard(): BoardCell[][] {
	return Array.from({ length: 6 }, (_, row) =>
		Array.from({ length: 6 }, (_, col): BoardCell => ({
			position: { row, col },
			zoneId: '',
			glyphs: [],
			rune: null,
			hasCrux: false,
		}))
	);
}

/** A game whose whole board sits in one Zone of `element`, with Affinity in `mode`. */
function gameWith(element: Element, mode: Game['options']['affinity']): Game {
	const zone: Zone = {
		id: 'z', element, topLeft: { row: 0, col: 0 }, width: 6, height: 6,
		cruxPosition: { row: 0, col: 0 }, control: 'unbound',
	};
	return {
		...INIT_GAME_STATE,
		board: emptyBoard(),
		zones: [zone],
		options: { ...INIT_GAME_STATE.options, affinity: mode, cruxBonus: { bond: false, force: false } },
	};
}

describe('riftReducer — Affinity rift pulls', () => {
	it("pulls the Rift one step toward the inscriber per home-Zone card (mode 'rift')", () => {
		const state = gameWith('comet', 'rift');
		const event = new RuneInscribed({
			player: 'light',
			position: { row: 2, col: 2 },
			rune: { owner: 'light', flux: 0 },
			paidCards: [{ id: 'a', element: 'comet' }, { id: 'b', element: 'comet' }],
			activations: [] as Glyph[],
		});

		// Two home-Zone (comet) cards → +2 toward light.
		expect(riftReducer(event, state).rift).to.equal(2);
	});

	it('pulls toward dark (negative) and ignores off-element cards', () => {
		const state = { ...gameWith('comet', 'rift'), rift: 1 };
		const event = new RuneInscribed({
			player: 'dark',
			position: { row: 4, col: 1 },
			rune: { owner: 'dark', flux: 0 },
			// Only the comet card counts; the sun card is off-element.
			paidCards: [{ id: 'a', element: 'comet' }, { id: 'b', element: 'sun' }],
			activations: [] as Glyph[],
		});

		// One comet card → −1 toward dark, from a starting rift of 1.
		expect(riftReducer(event, state).rift).to.equal(0);
	});

	it('stacks with the inscriber\'s own ▲ activations', () => {
		const state = gameWith('comet', 'rift');
		const event = new RuneInscribed({
			player: 'light',
			position: { row: 0, col: 0 },
			rune: { owner: 'light', flux: 0 },
			paidCards: [{ id: 'a', element: 'comet' }],
			activations: ['▲'] as Glyph[],
		});

		// One ▲ (+1) + one comet Affinity pull (+1) = +2.
		expect(riftReducer(event, state).rift).to.equal(2);
	});

	it("leaves the Rift untouched by paid cards in 'value' mode", () => {
		const state = gameWith('comet', 'value');
		const event = new RuneInscribed({
			player: 'light',
			position: { row: 2, col: 2 },
			rune: { owner: 'light', flux: 0 },
			paidCards: [{ id: 'a', element: 'comet' }, { id: 'b', element: 'comet' }],
			activations: [] as Glyph[],
		});

		// Value mode doubles payment, not the Rift — no card-driven shift.
		expect(riftReducer(event, state).rift).to.equal(0);
	});
});
