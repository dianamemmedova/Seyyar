import { Routes } from '@angular/router';
import { requireLogin } from '@seyyar/shared';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Giriş — Seyyar Admin',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    // Everything else needs an ADMIN account
    path: '',
    canActivate: [requireLogin({ loginUrl: '/login', roles: ['ADMIN'] })],
    loadComponent: () => import('./layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        title: 'İdarə paneli — Seyyar Admin',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
