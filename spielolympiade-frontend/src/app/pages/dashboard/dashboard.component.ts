import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  auth = inject(AuthService);
  http = inject(HttpClient);
  router = inject(Router);

  username = this.auth.getUser()?.username ?? 'Unbekannt';
  team: any;
  allTeams: any[] = [];
  allGames: any[] = [];
  allResults: any[] = [];
  todayResults: any[] = [];
  upcomingGames: any[] = [];
  tableData: any[] = [];
  activeGameDay = true; // optional: später dynamisch machen

  ngOnInit(): void {
    this.loadMyTeam();
    this.loadData();
  }

  loadMyTeam(): void {
    this.http.get<any>(`${API_URL}/users/my-team`).subscribe({
      next: (res) => {
        this.team = res;
        this.loadTable();
      },
      error: () => (this.team = null),
    });
  }

  loadTable(): void {
    if (!this.team?.seasonId) return;
    this.http
      .get<any[]>(`${API_URL}/seasons/${this.team.seasonId}/table`)
      .subscribe({
        next: (data) => (this.tableData = data),
        error: (err) => console.error('Fehler beim Laden der Tabelle', err),
      });
  }

  loadData(): void {
    this.http.get<any>(`${API_URL}/seasons/public/dashboard-data`).subscribe({
      next: (data) => {
        this.allTeams = data.teams;
        this.allGames = data.games;
        this.allResults = data.results;

        this.buildTodayData();
        this.buildUpcoming();
      },
      error: (err) => console.error('Fehler beim Laden der Daten', err),
    });
  }

  buildTodayData(): void {
    const today = new Date().toISOString().split('T')[0]; // yyyy-mm-dd
    this.todayResults = this.allResults.filter((r) => r.date === today);
  }

  buildUpcoming(): void {
    if (!this.team) return;

    this.upcomingGames = this.allResults
      .filter((r) => !r.team1Score && !r.team2Score)
      .filter((r) => r.team1Id === this.team.id || r.team2Id === this.team.id);
  }

  getTeamName(id: string): string {
    return this.allTeams.find((t) => t.id === id)?.name ?? id;
  }

  getGameName(id: string): string {
    return this.allGames.find((g) => g.id === id)?.name ?? id;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
