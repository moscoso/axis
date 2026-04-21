import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface CircleItem {
    src: string;
    alt: string;
    href?: string;
}

@Component({
    selector: 'app-items-in-circle',
    standalone: true,
    templateUrl: './items-in-circle.html',
    styleUrls: ['./items-in-circle.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemsInCircle {
    readonly items = input<CircleItem[]>([]);
    readonly count = computed(() => this.items().length);
}
