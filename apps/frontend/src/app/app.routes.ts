import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'activate',
    loadComponent: () => import('./features/activation/activation.component').then(m => m.ActivationComponent)
  },
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  }
];
