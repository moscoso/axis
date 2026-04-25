import { Routes } from '@angular/router';

export const ACCOUNT_ROUTES: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
    },
    {
        path: 'register',
        loadComponent: () => import('./register/register.page').then(m => m.RegisterPage),
    },
    {
        path: 'signup',
        loadComponent: () => import('./register/register.page').then(m => m.RegisterPage),
    },
    {
        path: 'sign-up',
        loadComponent: () => import('./register/register.page').then(m => m.RegisterPage),
    },
];
