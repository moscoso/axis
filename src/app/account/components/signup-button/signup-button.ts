import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-signup-button',
    standalone: true,
    imports: [MatButtonModule, RouterLink],
    template: `<button mat-raised-button color="accent" routerLink="/signup">Create an account</button>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupButton {}
