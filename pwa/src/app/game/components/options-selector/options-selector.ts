import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { GameOptions } from 'axis-models';

/**
 * House-rule selector. The dice rewrite (v18) ships with no optional rules, so
 * this is currently an informational placeholder — kept as the extension point
 * for future toggles (they'd patch the table via SetOptions, as before).
 */
@Component({
    selector: 'app-options-selector',
    standalone: true,
    templateUrl: './options-selector.html',
    styleUrls: ['./options-selector.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionsSelector {
    readonly current = input.required<GameOptions>();
}
