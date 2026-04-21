import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { clientTableCommand } from 'axis-models';
import { firstValueFrom, map } from 'rxjs';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { DealerFacade } from '../../../core/state/dealer/dealer.facade';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
    selector: 'app-join-form',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
    ],
    templateUrl: './join-form.html',
    styleUrls: ['./join-form.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinForm {
    private readonly auth = inject(AuthFacade);
    private readonly dealer = inject(DealerFacade);
    private readonly toast = inject(ToastService);
    private readonly dialogRef = inject(MatDialogRef<JoinForm>);

    readonly name = new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(32)],
    });

    readonly form = new FormGroup({ name: this.name });

    /** Suggested name from the authed user's displayName/email, if any. */
    readonly suggestedName = toSignal(
        this.auth.selectUserInfo().pipe(
            map(info => info?.displayName ?? info?.email?.split('@')[0] ?? '')
        ),
        { initialValue: '' }
    );

    constructor() {
        // Pre-populate the name control once a suggested name resolves.
        const sub = this.auth
            .selectUserInfo()
            .subscribe(info => {
                const suggested = info?.displayName ?? info?.email?.split('@')[0] ?? '';
                if (suggested && !this.name.value) {
                    this.name.setValue(suggested);
                }
                sub.unsubscribe();
            });
    }

    async onSubmit(): Promise<void> {
        if (this.form.invalid) return;
        try {
            const id = await this.auth.getUserID();
            const info = await firstValueFrom(this.auth.selectUserInfo());
            const user = {
                id,
                name: this.name.value.trim() || info?.displayName || 'Anonymous',
                photoURL: info?.photoURL ?? '',
            };
            const command = clientTableCommand('JoinTable', { user });
            this.dealer.signalAsHost(command);
            this.dialogRef.close();
        } catch (error) {
            this.toast.failed('Could not join', (error as Error)?.message);
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
