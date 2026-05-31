/**
 * Tunable rules for a single AXIS game. Baked into {@link Game} at
 * {@link StartGame} time so every command sees them without cross-lookup.
 * New options live here as plain number/boolean fields; UI can expose them in
 * the lobby later.
 */
export interface GameOptions {
	/**
	 * Draws granted at the start of each player's main turn. They must be
	 * resolved before the main action (Inscribe or Draw). 0 = vanilla rules.
	 */
	startOfTurnDraws: number;

	/**
	 * When true, the board is dealt with shift glyphs (↑ → ↓ ←) and activating
	 * one slides its row/column with edge wraparound. When false, no shift
	 * glyphs are generated and the board uses only +, ▲, ◇ (legacy behavior).
	 */
	shiftGlyphs: boolean;

	/**
	 * When true (default), a card counts as 2 (cost + activations) when inscribed
	 * on a space in its own element's Zone (Affinity). When false, only Bond —
	 * controlling the matching Crux — doubles a card's value. A design-exploration
	 * toggle for comparing play (and bot strength) with and without Affinity.
	 */
	affinity: boolean;
}

/** The baseline rules — matches the rulebook (Affinity on; no house variants). */
export const DEFAULT_OPTIONS: GameOptions = Object.freeze<GameOptions>({
	startOfTurnDraws: 0,
	shiftGlyphs: false,
	affinity: true,
});
