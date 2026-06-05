import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';
import { Glyph, isShiftGlyph } from '../../../Glyph/Glyph';
import { shiftBoard } from '../../../Board/shiftBoard';

export function boardReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return { ...state, board: event.payload.board };

		case 'Rune Inscribed': {
			const { position, rune, activations } = event.payload;
			// Flux = the configurable base charge plus one per `+` activation.
			const fluxCount = state.options.baseRuneCharge + activations.filter((g: Glyph) => g === '+').length;

			let board = state.board.map(r => r.map(cell => ({ ...cell })));
			board[position.row][position.col] = {
				...board[position.row][position.col],
				rune: { ...rune, flux: fluxCount }
			};

			if (state.options.shiftGlyphs) {
				for (const activation of activations) {
					if (isShiftGlyph(activation)) {
						board = shiftBoard(board, activation, position);
					}
				}
			}

			return { ...state, board };
		}

		case 'Spell Cast': {
			// Charge: +1 Flux to each of the caster's runes within the footprint.
			const { player, footprint, spell } = event.payload;
			if (spell.effect !== 'charge') return state;

			const board = state.board.map(r => r.map(cell => ({ ...cell })));
			for (const pos of footprint) {
				const cell = board[pos.row][pos.col];
				if (cell.rune && cell.rune.owner === player) {
					cell.rune = { ...cell.rune, flux: cell.rune.flux + 1 };
				}
			}
			return { ...state, board };
		}

		default:
			return state;
	}
}
