import { Routes } from '@angular/router';
import { accountGuard } from './core/account.guard';
import { DEFAULT_LANG, langGuard } from './core/language';
import { Shell } from './layout/shell';

export const routes: Routes = [
  // "/" -> "/en"
  { path: '', pathMatch: 'full', redirectTo: DEFAULT_LANG },
  {
    // Every page starts with the language: /en, /ru/hotels, /az/restaurants/...
    path: ':lang',
    canActivate: [langGuard],
    // Header + footer around every page
    component: Shell,
    children: [
      { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
      {
        path: 'auth',
        children: [
          { path: 'login', loadComponent: () => import('./pages/auth/login').then((m) => m.Login) },
          {
            path: 'forgot-password',
            loadComponent: () =>
              import('./pages/auth/forgot-password').then((m) => m.ForgotPassword),
          },
          {
            path: 'reset-password',
            loadComponent: () => import('./pages/auth/reset-password').then((m) => m.ResetPassword),
          },
        ],
      },
      {
        // Only for logged-in users (rendered in the browser, see app.routes.server.ts)
        path: 'account',
        canActivate: [accountGuard],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'requests' },
          {
            path: 'requests',
            loadComponent: () => import('./pages/account/my-requests').then((m) => m.MyRequests),
          },
          {
            path: 'requests/:code',
            loadComponent: () =>
              import('./pages/account/request-detail').then((m) => m.RequestDetail),
          },
          {
            path: 'favorites',
            loadComponent: () => import('./pages/account/favorites').then((m) => m.Favorites),
          },
        ],
      },
      {
        path: '**',
        loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
