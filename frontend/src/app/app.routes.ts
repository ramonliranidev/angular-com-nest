import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    children: [
      {
        path: '',
        component: MainComponent,
      },
      {
        path: 'auth',
        loadChildren: () =>
          import('./auth/auth.router').then(m => m.AUTH_ROUTES),
      },
    ],
  },
];
