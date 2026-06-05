import { SpellCard, SpellShape } from './Spell';

/** Force cost per shape — scales with reach. */
const SHAPE_COST: Record<SpellShape, number> = {
	single: 1,
	row3:   2,
	col3:   2,
	x5:     3,
	block4: 3,
};

/** Display name per shape. */
const SHAPE_NAME: Record<SpellShape, string> = {
	single: 'Charge',
	row3:   'Charge Row',
	col3:   'Charge Column',
	x5:     'Charge Cross',
	block4: 'Charge Block',
};

/** How many copies of each shape go in the v1 deck. */
const SHAPE_COPIES: Record<SpellShape, number> = {
	single: 4,
	row3:   3,
	col3:   3,
	x5:     3,
	block4: 3,
};

/**
 * Builds the v1 Spell deck: Charge cards across all five footprints, costed by
 * reach. Content is intentionally simple and tunable — every card is a `charge`
 * effect that adds Flux to the caster's runes within its footprint.
 */
export function createSpellDeck(): SpellCard[] {
	const deck: SpellCard[] = [];
	for (const shape of Object.keys(SHAPE_COPIES) as SpellShape[]) {
		for (let i = 0; i < SHAPE_COPIES[shape]; i++) {
			deck.push({
				id: `spell-${shape}-${i}`,
				name: SHAPE_NAME[shape],
				shape,
				effect: 'charge',
				forceCost: SHAPE_COST[shape],
			});
		}
	}
	return deck;
}
