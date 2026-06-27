/**
 * Tunable rules for a single AXIS game, baked into {@link Game} at
 * {@link StartGame} time so commands read them without cross-lookup.
 */
export interface GameOptions {
	/**
	 * After inscribing, reroll BOTH dice whose colors are the inscribed cell's
	 * (row + column). Default (false) rerolls only the die that was used.
	 */
	rerollBothColors: boolean;
}

/** Baseline rulebook (v18) config. */
export const DEFAULT_OPTIONS: GameOptions = Object.freeze<GameOptions>({
	rerollBothColors: false,
});
