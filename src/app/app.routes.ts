import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PlayerManagementComponent } from './player-management/player-management.component';
import { TeamsManagmentComponent } from './teams-managment/teams-managment.component';
import { SpieleComponent } from './spiele/spiele.component';
import { HistoryComponent } from './history/history.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'players', component: PlayerManagementComponent },  // Route für die Spielerverwaltung
  { path: 'teams', component: TeamsManagmentComponent },  // Route für die Spielerverwaltung
  { path: 'spiele', component: SpieleComponent },  // Route für die Spielerverwaltung
  { path: 'history', component: HistoryComponent }
];
