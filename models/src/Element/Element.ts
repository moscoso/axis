/**
 * The six celestial suits. Cards and Zones carry one; Affinity matches a card
 * to its home Zone. Pure tags — no suit interacts with the Light/Dark axis.
 */
export type Element = 'sun' | 'moon' | 'star' | 'comet' | 'planet' | 'black-hole';

/** Canonical suit order (deck building, zone assignment, UI iteration). */
export const ELEMENTS: Element[] = ['sun', 'moon', 'star', 'comet', 'planet', 'black-hole'];
