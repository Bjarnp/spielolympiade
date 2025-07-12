import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import {
  MatCheckboxModule,
  MatCheckboxChange,
} from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-start-season',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatListModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './start-season.component.html',
  styleUrls: ['./start-season.component.scss'],
})
export class StartSeasonComponent {
  http = inject(HttpClient);
  router = inject(Router);
  dialog = inject(MatDialog);

  @ViewChild('systemInfo') systemInfo!: TemplateRef<unknown>;

  step = 1;
  year = new Date().getFullYear() + 1;
  name = 'Spielolympiade ' + this.year;

  seasons: any[] = [];

  players: any[] = [];
  selectedPlayers: any[] = [];

  teams: { name: string; playerIds: string[] }[] = [];
  newTeamName = '';
  newTeamPlayers: string[] = [];

  games: any[] = [];
  selectedGameIds: string[] = [];

  system = 'round_robin';

  ngOnInit(): void {
    this.http
      .get<any[]>(`${API_URL}/users`)
      .subscribe((u) => (this.players = u));
    this.http.get<any[]>(`${API_URL}/games`).subscribe((g) => (this.games = g));
    this.http.get<any[]>(`${API_URL}/seasons`).subscribe((s) => {
      this.seasons = s;
      const maxYear = this.seasons.reduce(
        (max, cur) => (cur.year > max ? cur.year : max),
        new Date().getFullYear()
      );
      this.year = maxYear;
      this.name = 'Spielolympiade ' + this.year;
    });
  }

  getPlayerName = (id: string): string => {
    return this.players.find((p) => p.id === id)?.name ?? id;
  };

  formatPlayers(ids: string[]): string {
    return ids.map((id) => this.getPlayerName(id)).join(', ');
  }

  getGameName = (id: string): string => {
    return this.games.find((g) => g.id === id)?.name ?? id;
  };

  toggleGame(id: string, event: MatCheckboxChange): void {
    const checked = event.checked;
    if (checked) this.selectedGameIds.push(id);
    else this.selectedGameIds = this.selectedGameIds.filter((g) => g !== id);
  }

  addTeam(): void {
    if (!this.newTeamName || this.newTeamPlayers.length === 0) return;
    this.teams.push({
      name: this.newTeamName,
      playerIds: [...this.newTeamPlayers],
    });
    this.newTeamName = '';
    this.newTeamPlayers = [];
  }

  removeTeam(index: number): void {
    this.teams.splice(index, 1);
  }

  availablePlayers(): any[] {
    const used = this.teams.flatMap((t) => t.playerIds);
    return this.selectedPlayers.filter((p) => !used.includes(p.id));
  }

  generateTeams(): void {
    const shuffled = [...this.selectedPlayers].sort(() => Math.random() - 0.5);
    this.teams = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      const members = shuffled.slice(i, i + 2);
      this.teams.push({
        name: 'Team ' + (this.teams.length + 1),
        playerIds: members.map((m) => m.id),
      });
    }
    if (
      this.teams.length > 1 &&
      this.teams[this.teams.length - 1].playerIds.length === 1
    ) {
      const last = this.teams.pop();
      this.teams[this.teams.length - 1].playerIds.push(last!.playerIds[0]);
    }
  }

  next(): void {
    if (this.step < 4) this.step++;
  }

  prev(): void {
    if (this.step > 1) this.step--;
  }

  openInfo(): void {
    this.dialog.open(this.systemInfo);
  }

  getBeerInfo(): string {
    const teams = this.teams.length;
    const games = this.selectedGameIds.length || 1;

    if (teams <= 1) {
      return '0 Bier';
    }

    switch (this.system) {
      case 'round_robin': {
        const beers = (teams - 1) * games;
        return `${beers} Bier pro Person`;
      }
      case 'single_elim': {
        const rounds = Math.ceil(Math.log2(teams));
        const beers = rounds * games;
        return `${beers} Bier pro Person`;
      }
      case 'double_elim': {
        const rounds = Math.ceil(Math.log2(teams)) * 2;
        const beers = rounds * games;
        return `${beers} Bier pro Person`;
      }
      case 'group_ko': {
        const groupA = Math.ceil(teams / 2);
        const groupB = Math.floor(teams / 2);
        const minGroup = Math.min(groupA, groupB) - 1;
        const maxGroup = Math.max(groupA, groupB) - 1;
        const groupOnly = `${minGroup * games}-${maxGroup * games}`;
        const semi = `${(minGroup + 1) * games}-${(maxGroup + 1) * games}`;
        const finale = `${(minGroup + 2) * games}-${(maxGroup + 2) * games}`;
        return `Nur Gruppenphase: ${groupOnly}, Halbfinale: ${semi}, Finale/Platz 3: ${finale}`;
      }
      default:
        return '0 Bier';
    }
  }

  start(): void {
    const payload = {
      year: this.year,
      name: this.name,
      teams: this.teams,
      gameIds: this.selectedGameIds,
      system: this.system,
    };
    this.http.post(`${API_URL}/seasons/setup`, payload).subscribe(() => {
      this.router.navigate(['/dashboard']);
    });
  }
}
