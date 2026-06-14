import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { AffinityMode, GameOptions, clientTableCommand } from 'axis-models';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { DealerFacade } from '../../../core/state/dealer/dealer.facade';

@Component({
    selector: 'app-options-selector',
    standalone: true,
    imports: [MatButtonModule],
    templateUrl: './options-selector.html',
    styleUrls: ['./options-selector.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionsSelector {
    readonly current = input.required<GameOptions>();

    private readonly auth = inject(AuthFacade);
    private readonly dealer = inject(DealerFacade);

    private readonly userId = toSignal(this.auth.selectUserID(), { initialValue: 'unknown' });

    /** Highest base charge the stepper allows. */
    private static readonly MAX_BASE_CHARGE = 3;

    /** Cycle order for the Affinity control; tap advances to the next mode. */
    private static readonly AFFINITY_CYCLE: readonly AffinityMode[] = ['off', 'value', 'rift'];
    private static readonly AFFINITY_LABEL: Record<AffinityMode, string> = {
        off: 'Off',
        value: 'Value ×2',
        rift: 'Rift Pull',
    };

    readonly disabled = computed(() => this.userId() === 'unknown');
    readonly shiftGlyphs = computed(() => this.current().shiftGlyphs);
    readonly affinity = computed(() => this.current().affinity);
    readonly affinityActive = computed(() => this.affinity() !== 'off');
    readonly affinityLabel = computed(() => OptionsSelector.AFFINITY_LABEL[this.affinity()]);
    readonly baseRuneCharge = computed(() => this.current().baseRuneCharge);
    readonly spells = computed(() => this.current().spells);
    readonly bond = computed(() => this.current().cruxBonus.bond);
    readonly force = computed(() => this.current().cruxBonus.force);

    readonly canDecCharge = computed(() => !this.disabled() && this.baseRuneCharge() > 0);
    readonly canIncCharge = computed(
        () => !this.disabled() && this.baseRuneCharge() < OptionsSelector.MAX_BASE_CHARGE
    );

    toggleShiftGlyphs(): void { this.patch({ shiftGlyphs: !this.shiftGlyphs() }); }
    cycleAffinity(): void {
        const cycle = OptionsSelector.AFFINITY_CYCLE;
        const next = cycle[(cycle.indexOf(this.affinity()) + 1) % cycle.length];
        this.patch({ affinity: next });
    }
    toggleSpells(): void { this.patch({ spells: !this.spells() }); }

    stepBaseCharge(delta: number): void {
        const next = Math.max(0, Math.min(OptionsSelector.MAX_BASE_CHARGE, this.baseRuneCharge() + delta));
        if (next !== this.baseRuneCharge()) this.patch({ baseRuneCharge: next });
    }

    // cruxBonus is merged shallowly, so send the whole sub-object each time.
    toggleBond(): void { this.patch({ cruxBonus: { ...this.current().cruxBonus, bond: !this.bond() } }); }
    toggleForce(): void { this.patch({ cruxBonus: { ...this.current().cruxBonus, force: !this.force() } }); }

    private patch(options: Partial<GameOptions>): void {
        if (this.disabled()) return;
        this.dealer.signalAsHost(clientTableCommand('SetOptions', { userId: this.userId(), options }));
    }
}
