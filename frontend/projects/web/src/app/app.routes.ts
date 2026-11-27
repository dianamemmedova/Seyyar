import { Routes } from '@angular/router';
import { DEFAULT_LANG, langGuard } from './core/language';

export const routes: Routes = [
  // "/" -> "/en"
  { path: '', pathMatch: 'full', redirectTo: DEFAULT_LANG },
  {
    // Every page starts with the language: /en, /ru/hotels, /az/restaurants/...
    path: ':lang',
    canActivate: [langGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
      {
        path: '**',
        loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
