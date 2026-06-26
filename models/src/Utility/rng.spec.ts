import { expect } from 'chai';
import { mulberry32, rollFaces } from './rng';
import { GLYPHS } from '../Glyph/Glyph';

describe('rng', () => {
	it('mulberry32 is deterministic for a given seed', () => {
		const a = mulberry32(12345);
		const b = mulberry32(12345);
		const seqA = [a(), a(), a()];
		const seqB = [b(), b(), b()];
		expect(seqA).to.deep.equal(seqB);
	});

	it('different seeds diverge', () => {
		const a = mulberry32(1);
		const b = mulberry32(2);
		expect(a()).to.not.equal(b());
	});

	it('rollFaces returns valid glyph faces', () => {
		const faces = rollFaces(999, 0, 6);
		expect(faces.length).to.equal(6);
		for (const f of faces) expect(GLYPHS).to.include(f);
	});

	it('rollFaces is reproducible and the cursor skips consumed draws', () => {
		const seed = 4242;
		const all = rollFaces(seed, 0, 8);          // draws 0..7
		const firstSix = rollFaces(seed, 0, 6);     // draws 0..5
		const nextTwo = rollFaces(seed, 6, 2);      // draws 6..7 (after the cursor)
		expect(firstSix).to.deep.equal(all.slice(0, 6));
		expect(nextTwo).to.deep.equal(all.slice(6, 8));
	});
});
