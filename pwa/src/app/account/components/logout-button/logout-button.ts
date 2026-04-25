import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthFacade } from '../../../core/state/auth/auth.facade';

@Component({
    selector: 'app-logout-button',
    standalone: true,
    imports: [MatButtonModule],
    template: `<button mat-button color="primary" (click)="logout()">Log out</button>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoutButton {
    private readonly authService = inject(AuthFacade);

    logout(): void {
        this.authService.logout();
    }
}
