import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { GameOptions, clientTableCommand } from 'axis-models';
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

    readonly disabled = computed(() => this.userId() === 'unknown');
    readonly shiftGlyphs = computed(() => this.current().shiftGlyphs);

    toggleShiftGlyphs(): void {
        if (this.disabled()) return;
        const command = clientTableCommand('SetOptions', {
            userId: this.userId(),
            options: { shiftGlyphs: !this.shiftGlyphs() },
        });
        this.dealer.signalAsHost(command);
    }
}
