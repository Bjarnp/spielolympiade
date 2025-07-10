import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-start-season',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './start-season.component.html',
  styleUrls: ['./start-season.component.scss']
})
export class StartSeasonComponent {
  http = inject(HttpClient);
  router = inject(Router);

  step = 1;
  year = new Date().getFullYear() + 1;
  name = 'Spielolympiade ' + this.year;

  players: any[] = [];
  selectedPlayers: any[] = [];

  teams: { name: string; playerIds: string[] }[] = [];
  newTeamName = '';
  newTeamPlayers: string[] = [];

  games: any[] = [];
  selectedGameIds: string[] = [];

  system = 'round_robin';

  ngOnInit(): void {
    this.http.get<any[]>(`${API_URL}/users`).subscribe((u) => (this.players = u));
    this.http
      .get<any>(`${API_URL}/seasons/public/dashboard-data`)
      .subscribe((d) => (this.games = d.games));
  }

  togglePlayer(p: any, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.selectedPlayers.push(p);
    else this.selectedPlayers = this.selectedPlayers.filter((x) => x.id !== p.id);
  }

  getPlayerName(id: string): string {
    return this.players.find((p) => p.id === id)?.name ?? id;
  }

  getGameName(id: string): string {
    return this.games.find((g) => g.id === id)?.name ?? id;
  }

  toggleGame(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.selectedGameIds.push(id);
    else this.selectedGameIds = this.selectedGameIds.filter((g) => g !== id);
  }

  addTeam(): void {
    if (!this.newTeamName || this.newTeamPlayers.length === 0) return;
    this.teams.push({ name: this.newTeamName, playerIds: [...this.newTeamPlayers] });
    this.newTeamName = '';
    this.newTeamPlayers = [];
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
