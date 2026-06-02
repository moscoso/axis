import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { UiPreferencesService } from '../../../core/services/ui-preferences.service';
import { Drawer } from '../drawer/drawer';

/**
 * Settings panel for local display preferences: independent size knobs for
 * the scoring widgets and the hands, plus a toggle for the board's discount
 * guideline edges. Renders inside a shared Drawer. Reads/writes
 * UiPreferencesService, which persists choices.
 */
@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [Drawer],
    templateUrl: './settings.html',
    styleUrls: ['./settings.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
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
