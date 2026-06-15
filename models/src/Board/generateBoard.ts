import { ELEMENTS } from '../Element/Element';
import { Glyph } from '../Glyph/Glyph';
import { BoardCell, Game } from '../Game/Game';
import { shuffle } from '../Utility/shuffle';
import { Position, Zone } from '../Zone/Zone';
import { dealGlyphs, dealLegacyGlyphs } from './dealGlyphs';

/** Glyph counts dealt to each zone's 5 non-crux cells — one cell of each cost. */
const ZONE_COSTS = [2, 3, 4, 5, 6];

interface Region {
	id: string;
	topLeft: Position;
	width: number;
	height: number;
}

/**
 * Carves the 6×6 board into six 2×3 regions. One orientation per game,
 * chosen at random:
 * - 'wide': 3-wide × 2-tall zones in a 2-across × 3-down grid.
 * - 'tall': 2-wide × 3-tall zones in a 3-across × 2-down grid.
 */
function carveRegions(): Region[] {
	const wide = Math.random() < 0.5;
	const regions: Region[] = [];
	if (wide) {
		for (let band = 0; band < 3; band++) {
			for (let side = 0; side < 2; side++) {
				regions.push({
					id: `Z${regions.length + 1}`,
					topLeft: { row: band * 2, col: side * 3 },
					width: 3,
					height: 2,
				});
			}
		}
	} else {
		for (let band = 0; band < 2; band++) {
			for (let side = 0; side < 3; side++) {
				regions.push({
					id: `Z${regions.length + 1}`,
					topLeft: { row: band * 3, col: side * 2 },
					width: 2,
					height: 3,
				});
			}
		}
	}
	return regions;
}

/**
 * Places one Crux per region obeying Cross Exclusivity: all six Cruxes occupy
 * distinct rows AND distinct columns (a permutation of the board's lines).
 *
 * Regions tile the board in bands, so exclusivity decomposes per band: the
 * regions sharing a row-band split that band's rows between them, and the
 * regions sharing a column-band split that band's columns — both via shuffle.
 */
function placeCruxes(regions: Region[]): Position[] {
	const rowOf = new Map<Region, number>();
	const colOf = new Map<Region, number>();

	const rowBands = new Map<number, Region[]>();
	const colBands = new Map<number, Region[]>();
	for (const region of regions) {
		rowBands.set(region.topLeft.row, [...(rowBands.get(region.topLeft.row) ?? []), region]);
		colBands.set(region.topLeft.col, [...(colBands.get(region.topLeft.col) ?? []), region]);
	}

	for (const [bandStart, members] of rowBands) {
		const height = members[0].height;
		const rows = shuffle(Array.from({ length: height }, (_, i) => bandStart + i));
		members.forEach((region, i) => rowOf.set(region, rows[i]));
	}
	for (const [bandStart, members] of colBands) {
		const width = members[0].width;
		const cols = shuffle(Array.from({ length: width }, (_, i) => bandStart + i));
		members.forEach((region, i) => colOf.set(region, cols[i]));
	}

	return regions.map(region => ({ row: rowOf.get(region)!, col: colOf.get(region)! }));
}

/**
 * Generates a randomised 6×6 board and 6 zones for a new AXIS game.
 * - The board is carved into six 2×3 regions; orientation (wide/tall) is
 *   rolled once per game.
 * - The six celestial suits are randomly assigned, one per zone.
 * - Cruxes obey Cross Exclusivity: six distinct rows, six distinct columns.
 * - Each zone's 5 non-crux cells receive costs 2–6 exactly once (shuffled).
 * - When `shiftGlyphs` is true (default), 120 glyphs are distributed as 32 each
 *   of +, ▲, ◇ and 6 each of ↑, →, ↓, ←. A cell's shifts are all the same
 *   direction (mixed shift directions on one cell are forbidden); non-shift
 *   glyphs may freely co-exist with shifts. When false, every glyph is picked
 *   uniformly from +, ▲, ◇ and no shifts appear.
 */
export function generateBoard(
	{ shiftGlyphs = true }: { shiftGlyphs?: boolean } = {}
): Pick<Game, 'board' | 'zones'> {
	const regions = carveRegions();
	const elements = shuffle(ELEMENTS);
	const cruxes = placeCruxes(regions);

	const board: BoardCell[][] = Array.from({ length: 6 }, (_, row) =>
		Array.from({ length: 6 }, (_, col) => ({
			position: { row, col },
			zoneId: '',
			glyphs: [] as Glyph[],
			rune: null,
			hasCrux: false,
		}))
	);

	type Slot = { row: number; col: number; cost: number };
	const slots: Slot[] = [];

	const zones: Zone[] = regions.map((region, i) => {
		const cruxPosition = cruxes[i];
		const costs = shuffle([...ZONE_COSTS]);
		let costIndex = 0;

		for (let r = region.topLeft.row; r < region.topLeft.row + region.height; r++) {
			for (let c = region.topLeft.col; c < region.topLeft.col + region.width; c++) {
				const isCrux = r === cruxPosition.row && c === cruxPosition.col;
				board[r][c].zoneId = region.id;
				board[r][c].hasCrux = isCrux;
				if (!isCrux) {
					slots.push({ row: r, col: c, cost: costs[costIndex++] });
				}
			}
		}

		return {
			id: region.id,
			element: elements[i],
			topLeft: region.topLeft,
			width: region.width,
			height: region.height,
			cruxPosition,
			control: 'unbound' as const,
		};
	});

	const capacities = slots.map(s => s.cost);
	const glyphsPerSlot = shiftGlyphs ? dealGlyphs(capacities) : dealLegacyGlyphs(capacities);
	for (let i = 0; i < slots.length; i++) {
		const { row, col } = slots[i];
		board[row][col].glyphs = glyphsPerSlot[i];
	}

	return { board, zones };
}
