import { expect } from 'chai';
import { generateBoard } from './generateBoard';
import { ELEMENTS } from '../Element/Element';
import { Glyph, ShiftGlyph, SHIFT_GLYPHS, isShiftGlyph } from '../Glyph/Glyph';

describe('generateBoard — six 2×3 zones, constrained 120-glyph distribution', () => {
	const RUNS = 50;

	it('produces exactly 120 glyphs across all non-crux cells', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateBoard();
			const total = board.flat().reduce((sum, cell) => sum + cell.glyphs.length, 0);
			expect(total).to.equal(120);
		}
	});

	it('places 32 of each non-shift glyph and 6 of each shift direction', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateBoard();
			const counts: Partial<Record<Glyph, number>> = {};
			for (const cell of board.flat()) {
				for (const g of cell.glyphs) {
					counts[g] = (counts[g] ?? 0) + 1;
				}
			}
			expect(counts['+'], 'flux count').to.equal(32);
			expect(counts['▲'], 'force count').to.equal(32);
			expect(counts['◇'], 'draw count').to.equal(32);
			for (const dir of SHIFT_GLYPHS) {
				expect(counts[dir], `shift '${dir}' count`).to.equal(6);
			}
		}
	});

	it('never mixes two shift directions on the same cell', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateBoard();
			for (const cell of board.flat()) {
				const dirsHere = new Set<ShiftGlyph>();
				for (const g of cell.glyphs) {
					if (isShiftGlyph(g)) dirsHere.add(g);
				}
				expect(dirsHere.size, `cell (${cell.position.row},${cell.position.col})`).to.be.lessThan(2);
			}
		}
	});

	it('leaves Crux cells empty of glyphs', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateBoard();
			for (const cell of board.flat()) {
				if (cell.hasCrux) {
					expect(cell.glyphs).to.have.length(0);
				}
			}
		}
	});

	it('produces no shift glyphs when shiftGlyphs is off, but still 120 glyphs total', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateBoard({ shiftGlyphs: false });
			const all = board.flat().flatMap(cell => cell.glyphs);
			expect(all).to.have.length(120);
			expect(all.some(isShiftGlyph), 'no shift glyphs present').to.equal(false);
		}
	});

	it('carves six 2×3 zones (one orientation per game) that tile the board', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board, zones } = generateBoard();
			expect(zones).to.have.length(6);

			const dims = new Set(zones.map(z => `${z.width}x${z.height}`));
			expect(dims.size, 'single orientation per game').to.equal(1);
			expect(['3x2', '2x3']).to.include([...dims][0]);

			// Every cell belongs to exactly one zone (zoneIds cover the board).
			const cellsPerZone = new Map<string, number>();
			for (const cell of board.flat()) {
				expect(cell.zoneId).to.not.equal('');
				cellsPerZone.set(cell.zoneId, (cellsPerZone.get(cell.zoneId) ?? 0) + 1);
			}
			expect(cellsPerZone.size).to.equal(6);
			for (const count of cellsPerZone.values()) expect(count).to.equal(6);
		}
	});

	it('assigns each of the six suits to exactly one zone', () => {
		for (let i = 0; i < RUNS; i++) {
			const { zones } = generateBoard();
			const suits = zones.map(z => z.element).sort();
			expect(suits).to.deep.equal([...ELEMENTS].sort());
		}
	});

	it('places six Cruxes obeying Cross Exclusivity (distinct rows and columns)', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board, zones } = generateBoard();
			const rows = new Set(zones.map(z => z.cruxPosition.row));
			const cols = new Set(zones.map(z => z.cruxPosition.col));
			expect(rows.size, 'distinct crux rows').to.equal(6);
			expect(cols.size, 'distinct crux cols').to.equal(6);

			for (const zone of zones) {
				const { row, col } = zone.cruxPosition;
				// The crux sits inside its own zone.
				expect(row).to.be.at.least(zone.topLeft.row);
				expect(row).to.be.below(zone.topLeft.row + zone.height);
				expect(col).to.be.at.least(zone.topLeft.col);
				expect(col).to.be.below(zone.topLeft.col + zone.width);
				expect(board[row][col].hasCrux).to.equal(true);
			}
		}
	});

	it('gives each zone 5 non-crux cells with costs 2..6 exactly once', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board, zones } = generateBoard();
			for (const zone of zones) {
				const costs: number[] = [];
				for (let r = zone.topLeft.row; r < zone.topLeft.row + zone.height; r++) {
					for (let c = zone.topLeft.col; c < zone.topLeft.col + zone.width; c++) {
						if (!board[r][c].hasCrux) costs.push(board[r][c].glyphs.length);
					}
				}
				expect(costs.sort((a, b) => a - b)).to.deep.equal([2, 3, 4, 5, 6]);
			}
		}
	});
});
