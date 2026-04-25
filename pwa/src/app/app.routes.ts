import { Routes } from '@angular/router';
import { ACCOUNT_ROUTES } from './account/account.routes';
import { authGuard } from './guard/auth.guard';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'game' },
    {
        path: 'game',
        canActivate: [authGuard],
        loadComponent: () => import('./game/game.page').then(m => m.GamePage),
    },
    {
        path: 'create-profile',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./create-profile/create-profile.page').then(m => m.CreateProfilePage),
    },
    /**
     * `/logout` has no component — the AuthEffects' `logoutByRoute$` picks up
     * the NavigationEnd event and dispatches `logoutRequested`, which then
     * redirects to `/`.
     */
    { path: 'logout', children: [] },
    ...ACCOUNT_ROUTES,
    { path: '**', redirectTo: 'game' },
];
