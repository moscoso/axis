/**
 * Tunable rules for a single AXIS game, baked into {@link Game} at
 * {@link StartGame} time so commands read them without cross-lookup.
 */
export interface GameOptions {
	/** Draws at the start of each main turn, resolved before acting. 0 = vanilla. */
	startOfTurnDraws: number;

	/** Deal shift glyphs (↑→↓←) that slide their row/column (wrapping) when activated. */
	shiftGlyphs: boolean;

	/** How a card behaves when inscribed in its own element's Zone. See {@link AffinityMode} */
	affinity: AffinityMode;

	/** Amount of Flux a Rune starts with, before any `+` activations add on to it. */
	baseRuneCharge: number;

	/** Perks for controlling a Crux; each toggles independently. */
	cruxBonus: CruxBonus;

	/** Enable the Spell deck/display and the Cast a Spell action. */
	spells: boolean;
}

/** 
 * What a card's Affinity (home-Zone match) does.
 * - `'off'`   — no bonus.
 * - `'value'` — it counts as 2 (cost + activations); the classic Affinity.
 * - `'rift'`  — it pulls the Rift one step toward the player (like a ▲),
 *               once per home-Zone card paid. Its payment value stays 1.
 */
export type AffinityMode = 'off' | 'value' | 'rift';

/** Independent rewards for controlling a Crux. */
export interface CruxBonus {
	/** That element's cards count as 2 in ANY Zone. */
	bond: boolean;
	/** When an opponent inscribes inside a Zone you control, the Rift tugs +1 toward you. */
	force: boolean;
}

/** Baseline rulebook (v17) config: Affinity (value) + Crux Force on, Bond off, Runes start at 0 Flux. */
export const DEFAULT_OPTIONS: GameOptions = Object.freeze<GameOptions>({
	startOfTurnDraws: 1,
	shiftGlyphs: false,
	affinity: 'rift',
	baseRuneCharge: 0,
	cruxBonus: Object.freeze({ bond: false, force: true }),
	spells: false,
});
