import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Reusable slide-in drawer shell: a transparent click-to-close scrim plus a
 * side panel with a banner header and close button. Body content is projected
 * via the default slot; an optional footer is projected via `[drawerFooter]`.
 * Pin it to either edge with `side`.
 */
@Component({
    selector: 'app-drawer',
    standalone: true,
    templateUrl: './drawer.html',
    styleUrls: ['./drawer.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Drawer {
    readonly title = input.required<string>();
    readonly side = input<'left' | 'right'>('left');

    readonly close = output<void>();

    onClose(): void {
        this.close.emit();
    }
}
