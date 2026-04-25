import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Game, PlayerSide } from 'axis-models';

type WinReason = NonNullable<Game['winReason']>;

const REASON_LABEL: Record<WinReason, string> = {
    'rift-break': 'Rift Break',
    'fluxmate': 'Fluxmate',
    'last-rune': 'Last Rune',
};

const REASON_SUMMARY: Record<WinReason, string> = {
    'rift-break': 'The Rift track tipped past the threshold.',
    'fluxmate': 'All four Cruxes fell under one side.',
    'last-rune': 'Board is full — highest total Flux wins.',
};

@Component({
    selector: 'app-victory-modal',
    standalone: true,
    templateUrl: './victory-modal.html',
    styleUrls: ['./victory-modal.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[attr.data-winner]': 'winner() ?? "tie"' },
})
export class VictoryModal {
    /** `null` indicates a last-rune tie — header copy switches to "Draw". */
    readonly winner = input.required<PlayerSide | null>();
    readonly reason = input.required<WinReason>();
    readonly lightFlux = input<number | null>(null);
    readonly darkFlux = input<number | null>(null);

    readonly close = output<void>();
    readonly playAgain = output<void>();
    readonly newGame = output<void>();

    readonly isTie = computed(() => this.winner() === null);
    readonly bannerLabel = computed(() => (this.isTie() ? 'Draw' : 'Victory'));
    readonly reasonLabel = computed(() => REASON_LABEL[this.reason()]);
    readonly reasonSummary = computed(() => REASON_SUMMARY[this.reason()]);
    readonly showTallies = computed(
        () =>
            this.reason() === 'last-rune' &&
            this.lightFlux() !== null &&
            this.darkFlux() !== null
    );

    onClose(): void {
        this.close.emit();
    }

    onPlayAgain(): void {
        this.playAgain.emit();
    }

    onNewGame(): void {
        this.newGame.emit();
    }
}
