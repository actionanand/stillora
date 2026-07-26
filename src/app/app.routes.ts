import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Stillora · Relax',
    loadComponent: () => import('./features/home/home').then((module) => module.Home),
  },
  {
    path: 'mixes',
    title: 'Saved Mixes · Stillora',
    loadComponent: () => import('./features/mixes/mixes').then((module) => module.Mixes),
  },
  {
    path: 'settings',
    title: 'Settings · Stillora',
    loadComponent: () => import('./features/settings/settings').then((module) => module.Settings),
  },
  {
    path: 'about',
    title: 'About · Stillora',
    loadComponent: () => import('./features/about/about').then((module) => module.About),
  },
  { path: '**', redirectTo: '' },
];
