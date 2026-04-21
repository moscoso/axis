import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Rune as RuneModel } from 'axis-models';

@Component({
    selector: 'app-rune',
    standalone: true,
    template: `<span class="flux" [attr.aria-label]="label()">{{ display() }}</span>`,
    styleUrls: ['./rune.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[attr.data-owner]': 'rune().owner' },
})
export class Rune {
    readonly rune = input.required<RuneModel>();

    readonly display = computed(() => (this.rune().flux === 0 ? '∅' : String(this.rune().flux)));
    readonly label = computed(() => {
        const { owner, flux } = this.rune();
        return flux === 0 ? `${owner} null rune` : `${owner} rune, flux ${flux}`;
    });
}
