/**
 * Tunable rules for a single AXIS game, baked into {@link Game} at
 * {@link StartGame} time so commands read them without cross-lookup.
 */
export interface GameOptions {
	/** Draws at the start of each main turn, resolved before acting. 0 = vanilla. */
	startOfTurnDraws: number;

	/** Deal shift glyphs (↑→↓←) that slide their row/column (wrapping) when activated. */
	shiftGlyphs: boolean;

	/** A card counts as 2 (cost + activations) in its own element's Zone. */
	affinity: boolean;

	/** Amount of Flux a Rune starts with, before any `+` activations add on to it. */
	baseRuneCharge: number;

	/** Perks for controlling a Crux; each toggles independently. */
	cruxBonus: CruxBonus;

	/** Enable the Spell deck/display and the Cast a Spell action. */
	spells: boolean;
}

/** Independent rewards for controlling a Crux. */
export interface CruxBonus {
	/** That element's cards count as 2 in ANY Zone. */
	bond: boolean;
	/** When an opponent inscribes inside a Zone you control, the Rift tugs +1 toward you. */
	force: boolean;
}

/** Baseline rulebook (v17) config: Affinity + Crux Force on, Bond off, Runes start at 0 Flux. */
export const DEFAULT_OPTIONS: GameOptions = Object.freeze<GameOptions>({
	startOfTurnDraws: 0,
	shiftGlyphs: false,
	affinity: true,
	baseRuneCharge: 0,
	cruxBonus: Object.freeze({ bond: false, force: true }),
	spells: true,
});
