import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PlayerManagementComponent } from './player-management/player-management.component';
import { TeamsManagmentComponent } from './teams-managment/teams-managment.component';
import { SpieleComponent } from './spiele/spiele.component';
import { HistoryComponent } from './history/history.component';
import { LoginComponent } from './login/login.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'players', component: PlayerManagementComponent, canActivate: [authGuard] },
  { path: 'teams', component: TeamsManagmentComponent, canActivate: [authGuard] },
  { path: 'spiele', component: SpieleComponent, canActivate: [authGuard] },
  { path: 'history', component: HistoryComponent, canActivate: [authGuard] },
  { path: 'users', component: UserManagementComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
