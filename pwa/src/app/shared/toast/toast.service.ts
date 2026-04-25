import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
    private readonly snackBar = inject(MatSnackBar);

    dismiss(): void {
        this.snackBar.dismiss();
    }

    primary(message: string, duration = 3000): void {
        this.snackBar.open(message, 'OK', { duration });
    }

    success(message: string, duration = 3000): void {
        this.snackBar.open(message, 'OK', { duration, panelClass: 'toast-success' });
    }

    failed(message: string, detail?: string, duration = 10000): void {
        const text = detail ? `${message}: ${detail}` : message;
        this.snackBar.open(text, 'OK', { duration, panelClass: 'toast-failed' });
    }
}
