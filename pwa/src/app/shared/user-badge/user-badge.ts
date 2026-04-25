import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthFacade } from '../../core/state/auth/auth.facade';
import { DealerFacade } from '../../core/state/dealer/dealer.facade';

@Component({
    selector: 'app-user-badge',
    standalone: true,
    templateUrl: './user-badge.html',
    styleUrls: ['./user-badge.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserBadge {
    private readonly auth = inject(AuthFacade);
    private readonly dealer = inject(DealerFacade);

    private readonly userInfo = toSignal(this.auth.selectUserInfo(), {
        initialValue: undefined,
    });

    private readonly seat = toSignal(this.dealer.selectUserSeat(), {
        initialValue: null,
    });

    /**
     * Prefer the name the user typed at the JoinForm (it's attached to their
     * seat). Guests would otherwise all show up as "Anonymous" from the auth
     * displayName. Fall back to auth displayName / email / "Anonymous" only
     * when the user hasn't taken a seat yet.
     */
    readonly name = computed(() => {
        const seat = this.seat();
        if (seat?.user.name) return seat.user.name;
        const info = this.userInfo();
        return info?.displayName ?? info?.email?.split('@')[0] ?? 'Anonymous';
    });

    readonly photoURL = computed(
        () => this.seat()?.user.photoURL || this.userInfo()?.photoURL || ''
    );

    readonly initial = computed(() => this.name().charAt(0).toUpperCase() || '?');
}
