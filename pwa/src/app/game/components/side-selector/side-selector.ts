import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { SidePreference, clientTableCommand } from 'axis-models';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { DealerFacade } from '../../../core/state/dealer/dealer.facade';

const OPTIONS: readonly { value: SidePreference; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'random', label: 'Random' },
] as const;

@Component({
    selector: 'app-side-selector',
    standalone: true,
    imports: [MatButtonModule],
    templateUrl: './side-selector.html',
    styleUrls: ['./side-selector.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideSelector {
    readonly current = input<SidePreference | null>(null);

    private readonly auth = inject(AuthFacade);
    private readonly dealer = inject(DealerFacade);

    readonly options = OPTIONS;

    private readonly userId = toSignal(this.auth.selectUserID(), { initialValue: 'unknown' });

    readonly disabled = computed(() => this.userId() === 'unknown');

    select(pref: SidePreference): void {
        if (this.disabled()) return;
        const command = clientTableCommand('SelectSide', {
            userId: this.userId(),
            sidePreference: pref,
        });
        this.dealer.signalAsHost(command);
    }

    isCurrent(pref: SidePreference): boolean {
        return this.current() === pref;
    }
}
