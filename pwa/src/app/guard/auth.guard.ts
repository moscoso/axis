import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FireAuthService } from '../core/firebase/auth/FireAuth.service';
import { ToastService } from '../shared/toast/toast.service';

export const authGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
    const authService = inject(FireAuthService);
    const router = inject(Router);
    const toast = inject(ToastService);

    const user = await firstValueFrom(authService.getAuthState());
    if (user) {
        return true;
    }

    toast.failed('Authentication required - Please login');
    return router.parseUrl('/login');
};
