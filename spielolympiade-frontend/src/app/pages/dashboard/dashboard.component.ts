import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  auth = inject(AuthService);
  http = inject(HttpClient);
  team: any;
  allTeams: any[] = [];
  allGames: any[] = [];
  allResults: any[] = [];
  todayResults: any[] = [];
  upcomingGames: any[] = [];
  tableData: any[] = [];
  dataSource = new MatTableDataSource<any>();
  displayedColumns = ['place', 'name', 'spiele', 'siege', 'niederlagen', 'punkte'];
  seasonYear = '';
  activeGameDay = true; // optional: später dynamisch machen
  seasonActive = false;

  // Saison starten
  newYear = new Date().getFullYear();
  newName = 'Spielolympiade ' + this.newYear;
  showStartForm = false;

  // Ergebnis eintragen
  matchId = '';
  team1Score = 0;
  team2Score = 0;

  ngOnInit(): void {
    this.loadMyTeam();
    this.loadData();
  }

  loadMyTeam(): void {
    this.http.get<any>(`${API_URL}/users/my-team`).subscribe({
      next: (res) => {
        this.team = res;
        this.seasonYear = this.extractYear(res.season);
        this.seasonActive = true;
        this.loadTable();
      },
      error: () => {
        this.team = null;
        this.seasonActive = false;
      },
    });
  }

  loadTable(): void {
    if (!this.team?.seasonId) return;
    this.http
      .get<any[]>(`${API_URL}/seasons/${this.team.seasonId}/table`)
      .subscribe({
        next: (data) => {
          this.tableData = data;
          this.dataSource.data = data;
        },
        error: (err) => console.error('Fehler beim Laden der Tabelle', err),
      });
  }

  extractYear(name: string | undefined): string {
    if (!name) return '';
    const match = name.match(/\d{4}/);
    return match ? match[0] : name;
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

  toggleStart(): void {
    this.showStartForm = !this.showStartForm;
  }

  startSeason(): void {
    this.http
      .post(`${API_URL}/seasons/start`, {
        year: this.newYear,
        name: this.newName,
      })
      .subscribe(() => {
        this.showStartForm = false;
        this.loadMyTeam();
        this.loadData();
      });
  }

  saveResult(): void {
    if (!this.matchId) return;
    this.http
      .put(`${API_URL}/matches/${this.matchId}/result`, {
        team1Score: this.team1Score,
        team2Score: this.team2Score,
      })
      .subscribe(() => {
        this.matchId = '';
        this.team1Score = 0;
        this.team2Score = 0;
        this.loadData();
        this.loadTable();
      });
  }
}
