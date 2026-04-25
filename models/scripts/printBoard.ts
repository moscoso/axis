import { generateBoard } from '../src/Board/generateBoard';

const ELEMENT_COLOR: Record<string, string> = {
	fire:  '\x1b[31m',
	earth: '\x1b[32m',
	air:   '\x1b[36m',
	water: '\x1b[34m',
};
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';

const CELL_WIDTH = 20;

function color(str: string, code: string): string {
	return `${code}${str}${RESET}`;
}

function padRaw(str: string, width: number): string {
	return str.length >= width ? str : str + ' '.repeat(width - str.length);
}

function run() {
	const { board, zones } = generateBoard();

	const zoneByCell: Record<string, typeof zones[0]> = {};
	for (const zone of zones) {
		for (let r = zone.topLeft.row; r < zone.topLeft.row + 3; r++) {
			for (let c = zone.topLeft.col; c < zone.topLeft.col + 3; c++) {
				zoneByCell[`${r},${c}`] = zone;
			}
		}
	}

	console.log('\n' + color('  AXIS — Generated Board', BOLD) + '\n');

	// Column headers
	const header = '      ' + [0,1,2,3,4,5].map(c => padRaw(`col${c}`, CELL_WIDTH)).join('');
	console.log(color(header, DIM));
	console.log(color('      ' + '─'.repeat(CELL_WIDTH * 6), DIM));

	for (let r = 0; r < 6; r++) {
		const glyphLine: string[] = [];
		const infoLine:  string[] = [];

		for (let c = 0; c < 6; c++) {
			const cell = board[r][c];
			const zone = zoneByCell[`${r},${c}`];
			const col  = ELEMENT_COLOR[zone.element];

			const rawGlyphs = cell.hasCrux ? '[ CRUX ]' : (cell.glyphs.join(' ') || '—');
			const cost      = cell.hasCrux ? '' : ` ${cell.glyphs.length}`;
			const rawInfo   = zone.element[0].toUpperCase() + zone.id + cost;

			glyphLine.push(color(padRaw(rawGlyphs, CELL_WIDTH), cell.hasCrux ? BOLD + col : col));
			infoLine.push(color(padRaw(rawInfo, CELL_WIDTH), DIM));
		}

		console.log(`row${r} | ` + glyphLine.join(''));
		console.log('     | ' + infoLine.join(''));
		if (r === 2) console.log(color('     ' + '— '.repeat(CELL_WIDTH * 3), DIM));
	}

	console.log('\n' + color('  Zones', BOLD));
	for (const z of zones) {
		const col = ELEMENT_COLOR[z.element];
		console.log(
			`  ${color(z.id, BOLD + col)}  ${color(z.element, col)}` +
			color(`  crux (${z.cruxPosition.row},${z.cruxPosition.col})`, DIM)
		);
	}

	// Glyph summary
	const totals: Record<string, number> = { '+': 0, '▲': 0, '◇': 0 };
	for (const row of board) {
		for (const cell of row) {
			for (const g of cell.glyphs) {
				totals[g]++;
			}
		}
	}
	const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
	console.log('\n' + color('  Glyphs', BOLD));
	for (const [glyph, count] of Object.entries(totals)) {
		const pct = ((count / grandTotal) * 100).toFixed(1);
		console.log(`  ${glyph}  ${color(String(count), BOLD)}  ${color(`${pct}%`, DIM)}`);
	}
	console.log(color(`  total  ${grandTotal}`, DIM));
	console.log();
}

run();
