import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SPELL_FOOTPRINTS, SpellShape } from 'axis-models';

interface IconCell {
    filled: boolean;
    anchor: boolean;
}

/**
 * Renders a Spell footprint as a 3×3 mini-grid: filled cells are the affected
 * squares, the center carries an anchor dot. A 3×3 window (offsets −1..1 around
 * the anchor) contains every v1 shape, including block4 (which extends down-right
 * from its anchor).
 */
@Component({
    selector: 'app-spell-icon',
    standalone: true,
    templateUrl: './spell-icon.html',
    styleUrls: ['./spell-icon.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellIcon {
    readonly shape = input.required<SpellShape>();

    readonly cells = computed<IconCell[]>(() => {
        const filled = new Set(SPELL_FOOTPRINTS[this.shape()].map(o => `${o.dr},${o.dc}`));
        const out: IconCell[] = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                out.push({ filled: filled.has(`${dr},${dc}`), anchor: dr === 0 && dc === 0 });
            }
        }
        return out;
    });
}
