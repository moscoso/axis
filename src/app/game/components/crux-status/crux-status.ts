import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Element, Zone } from 'axis-models';

interface CruxRow {
    element: Element;
    control: Zone['control'];
}

@Component({
    selector: 'app-crux-status',
    standalone: true,
    templateUrl: './crux-status.html',
    styleUrls: ['./crux-status.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CruxStatus {
    readonly zones = input.required<Zone[]>();

    readonly rows = computed<CruxRow[]>(() =>
        this.zones().map(z => ({ element: z.element, control: z.control }))
    );
}
