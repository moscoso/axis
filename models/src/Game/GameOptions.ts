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
}

/** The baseline rules — matches the rulebook with no house variants applied. */
export const DEFAULT_OPTIONS: GameOptions = Object.freeze<GameOptions>({
	startOfTurnDraws: 0,
	shiftGlyphs: true,
});
