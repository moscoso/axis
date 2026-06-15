import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Rune as RuneModel } from 'axis-models';

@Component({
    selector: 'app-rune',
    standalone: true,
    template: `<span class="flux" [attr.aria-label]="label()">{{ display() }}</span>`,
    styleUrls: ['./rune.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.data-owner]': 'rune().owner',
        '[class.preview]': 'hasPreview()',
    },
})
export class Rune {
    readonly rune = input.required<RuneModel>();
    /** Projected flux after a pending move; when it differs, show "current → next". */
    readonly previewFlux = input<number | null>(null);

    readonly hasPreview = computed(() => {
        const next = this.previewFlux();
        return next !== null && next !== this.rune().flux;
    });

    readonly display = computed(() => {
        const current = Rune.fmt(this.rune().flux);
        return this.hasPreview() ? `${current} → ${Rune.fmt(this.previewFlux()!)}` : current;
    });

    readonly label = computed(() => {
        const { owner, flux } = this.rune();
        const base = flux === 0 ? `${owner} null rune` : `${owner} rune, flux ${flux}`;
        return this.hasPreview() ? `${base}, charging to ${this.previewFlux()}` : base;
    });

    private static fmt(flux: number): string {
        return flux === 0 ? '∅' : String(flux);
    }
}
