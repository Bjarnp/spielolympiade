import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'teams',
        loadComponent: () =>
          import('./pages/teams/teams.component').then((m) => m.TeamsComponent),
      },
      {
        path: 'matches',
        loadComponent: () =>
          import('./pages/matches/matches.component').then(
            (m) => m.MatchesComponent
          ),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./pages/history/history.component').then(
            (m) => m.HistoryComponent
          ),
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./pages/admin/admin.component').then((m) => m.AdminComponent),
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./pages/change-password/change-password.component').then(
            (m) => m.ChangePasswordComponent
          ),
      },
      {
        path: 'start-season',
        loadComponent: () =>
          import('./pages/start-season/start-season.component').then(
            (m) => m.StartSeasonComponent
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
