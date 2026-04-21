import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthFacade } from '../../../core/state/auth/auth.facade';

@Component({
    selector: 'app-login-form',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
    ],
    templateUrl: './login-form.html',
    styleUrls: ['./login-form.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginForm {
    private readonly authService = inject(AuthFacade);

    readonly email = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
    readonly password = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(128)] });

    readonly form = new FormGroup({
        email: this.email,
        password: this.password,
    });

    readonly hidePassword = signal(true);

    toggleHidePassword(): void {
        this.hidePassword.update(v => !v);
    }

    onSubmit(): void {
        if (this.form.valid) {
            const { email, password } = this.form.getRawValue();
            this.authService.login(email, password);
        }
    }

    guestLogin(): void {
        this.authService.loginAsGuest();
    }
}
