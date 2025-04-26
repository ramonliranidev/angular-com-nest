import { Routes } from '@angular/router';
import { LoginComponent } from './login/components/login.component';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
];
