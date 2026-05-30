import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { UiPreferencesService } from '../../../core/services/ui-preferences.service';

/**
 * Settings overlay for local display preferences: independent size knobs for
 * the scoring widgets and the hands, plus a toggle for the board's discount
 * guideline edges. Reads/writes UiPreferencesService, which persists choices.
 */
@Component({
    selector: 'app-settings-modal',
    standalone: true,
    templateUrl: './settings-modal.html',
    styleUrls: ['./settings-modal.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsModal {
    private readonly prefs = inject(UiPreferencesService);

    readonly close = output<void>();

    readonly scoringScale = this.prefs.scoringScale;
    readonly handScale = this.prefs.handScale;
    readonly boardGuides = this.prefs.boardGuides;

    readonly scoringPercent = computed(() => Math.round(this.scoringScale() * 100));
    readonly handPercent = computed(() => Math.round(this.handScale() * 100));

    readonly scoringAtMin = computed(() => this.scoringScale() <= this.prefs.min + 1e-6);
    readonly scoringAtMax = computed(() => this.scoringScale() >= this.prefs.max - 1e-6);
    readonly handAtMin = computed(() => this.handScale() <= this.prefs.min + 1e-6);
    readonly handAtMax = computed(() => this.handScale() >= this.prefs.max - 1e-6);

    decScoring(): void {
        this.prefs.decreaseScoring();
    }
    incScoring(): void {
        this.prefs.increaseScoring();
    }
    decHand(): void {
        this.prefs.decreaseHand();
    }
    incHand(): void {
        this.prefs.increaseHand();
    }
    toggleGuides(): void {
        this.prefs.toggleBoardGuides();
    }
    reset(): void {
        this.prefs.reset();
    }
    onClose(): void {
        this.close.emit();
    }
}
