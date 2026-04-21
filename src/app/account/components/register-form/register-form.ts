import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
    AbstractControl,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthFacade } from '../../../core/state/auth/auth.facade';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    const nonEmpty = password != null && password !== '';
    const matches = password === confirmPassword;
    return nonEmpty && matches ? null : { passwordMismatch: true };
}

@Component({
    selector: 'app-register-form',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
    ],
    templateUrl: './register-form.html',
    styleUrls: ['./register-form.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterForm {
    private readonly authDispatch = inject(AuthFacade);

    readonly email = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
    });
    readonly password = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6), Validators.maxLength(128)],
    });
    readonly confirmPassword = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6), Validators.maxLength(128)],
    });

    readonly form = new FormGroup(
        {
            email: this.email,
            password: this.password,
            confirmPassword: this.confirmPassword,
        },
        { validators: passwordsMatchValidator }
    );

    readonly hidePassword = signal(true);

    toggleHidePassword(): void {
        this.hidePassword.update(v => !v);
    }

    onSubmit(): void {
        if (this.form.valid) {
            const { email, password } = this.form.getRawValue();
            this.authDispatch.signup(email, password);
        }
    }
}
