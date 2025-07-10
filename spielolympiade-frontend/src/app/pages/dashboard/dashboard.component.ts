import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatCheckboxModule,
    FormsModule,
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
  @ViewChild(MatSort) sort!: MatSort;
  displayedColumns = ['place', 'name', 'spiele', 'siege', 'niederlagen', 'punkte'];
  seasonYear = '';
  activeGameDay = true; // optional: später dynamisch machen
  seasonActive = false;

  // Ergebnis eintragen direkt in Liste

  // Filter
  filterMode: 'all' | 'open' | 'played' = 'open';
  onlyMine = false;
  filteredGames: any[] = [];

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
        this.applyFilters();
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
          this.dataSource.sort = this.sort;
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
    this.upcomingGames = this.allResults.filter(
      (r) => r.team1Score == null && r.team2Score == null
    );
    this.applyFilters();
  }

  setFilter(mode: 'all' | 'open' | 'played'): void {
    this.filterMode = mode;
    this.applyFilters();
  }

  applyFilters(): void {
    let games = [...this.allResults];

    if (this.filterMode === 'open') {
      games = games.filter((g) => g.team1Score == null && g.team2Score == null);
    } else if (this.filterMode === 'played') {
      games = games.filter((g) => g.team1Score != null && g.team2Score != null);
    }

    if (this.onlyMine && this.team) {
      games = games.filter(
        (g) => g.team1Id === this.team.id || g.team2Id === this.team.id
      );
    }

    this.filteredGames = games;
  }

  getTeamName(id: string): string {
    return this.allTeams.find((t) => t.id === id)?.name ?? id;
  }

  getGameName(id: string): string {
    return this.allGames.find((g) => g.id === id)?.name ?? id;
  }

  saveResultFor(m: any): void {
    this.http
      .put(`${API_URL}/matches/${m.id}/result`, {
        team1Score: m.team1Score,
        team2Score: m.team2Score,
      })
      .subscribe(() => {
        this.loadData();
        this.loadTable();
      });
  }
}
