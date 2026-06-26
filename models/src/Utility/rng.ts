import { Glyph, GLYPHS } from '../Glyph/Glyph';

/**
 * Deterministic PRNG (mulberry32). Same seed → same stream. Used for every
 * dice roll so a game replays identically from its {@link GameSeed}.
 */
export function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Reproducibly rolls `count` glyph faces from `seed`, skipping the first
 * `cursor` draws already consumed by earlier rolls this game. Returns the faces;
 * the caller advances the cursor by `count`.
 */
export function rollFaces(seed: number, cursor: number, count: number): Glyph[] {
	const rng = mulberry32(seed);
	for (let i = 0; i < cursor; i++) rng();
	const faces: Glyph[] = [];
	for (let i = 0; i < count; i++) {
		faces.push(GLYPHS[Math.floor(rng() * GLYPHS.length)]);
	}
	return faces;
}
