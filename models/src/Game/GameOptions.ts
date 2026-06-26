/**
 * Tunable rules for a single AXIS game, baked into {@link Game} at
 * {@link StartGame} time so commands read them without cross-lookup.
 *
 * The dice rewrite removed every card-era knob (draws, shift glyphs, affinity,
 * Crux bonuses, spells). The struct is kept as a deliberate extension point —
 * future house rules hang here without re-threading the seed.
 */
export interface GameOptions {
	/** Reserved for future house rules. No knobs in the base game. */
	readonly _reserved?: never;
}

/** Baseline rulebook (v18) config: no optional rules. */
export const DEFAULT_OPTIONS: GameOptions = Object.freeze<GameOptions>({});
