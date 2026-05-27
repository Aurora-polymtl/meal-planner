import { Routes } from '@angular/router';
import { App } from './app';
import { LoginComponent } from './features/auth/login/login.component';
import { authGuard } from './features/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: App,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];