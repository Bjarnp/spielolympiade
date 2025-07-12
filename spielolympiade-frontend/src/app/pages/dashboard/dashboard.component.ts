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
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
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
    MatSelectModule,
    MatListModule,
    MatDividerModule,
    MatIconModule,
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
  allMatches: any[] = [];
  tournament: any = null;
  newMatch: any = { team1Id: '', team2Id: '', gameId: '' };
  todayResults: any[] = [];
  upcomingGames: any[] = [];
  tableData: any[] = [];
  dataSource = new MatTableDataSource<any>();
  @ViewChild(MatSort) sort!: MatSort;
  displayedColumns = [
    'place',
    'name',
    'spiele',
    'siege',
    'niederlagen',
    'punkte',
  ];
  seasonYear = '';
  activeGameDay = true; // optional: später dynamisch machen
  seasonActive = false;
  tournamentSystem = 'round_robin';
  viewMode = 'overall';

  // Ergebnis eintragen direkt in Liste

  // Filter
  filterMode: 'all' | 'open' | 'played' = 'open';
  onlyMine = false;
  filteredGames: any[] = [];
  recommendations: any[] = [];

  ngOnInit(): void {
    this.loadMyTeam();
    this.loadData();
    this.loadRecommendations();
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
        this.tournament = data.tournament;
        this.allMatches = (data.tournament ? data.tournament.matches : []).map(
          (m: any) => ({
            ...m,
            team1Score:
              m.results.find((r: any) => r.teamId === m.team1Id)?.score ?? null,
            team2Score:
              m.results.find((r: any) => r.teamId === m.team2Id)?.score ?? null,
            saved: true,
          })
        );
        this.tournamentSystem = data.tournament?.system || 'round_robin';

        this.buildTodayData();
        this.buildUpcoming();
      },
      error: (err) => console.error('Fehler beim Laden der Daten', err),
    });
  }

  buildTodayData(): void {
    const today = new Date().toISOString().split('T')[0]; // yyyy-mm-dd
    this.todayResults = this.allMatches.filter((r) => r.date === today);
  }

  buildUpcoming(): void {
    this.upcomingGames = this.allMatches.filter(
      (r) => r.team1Score == null && r.team2Score == null
    );
    this.applyFilters();
  }

  setFilter(mode: 'all' | 'open' | 'played'): void {
    this.filterMode = mode;
    this.applyFilters();
  }

  applyFilters(): void {
    let games = [...this.allMatches];

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

  updateResult(m: any, team: 'team1' | 'team2', value: number): void {
    if (team === 'team1') {
      m.team1Score = value;
      m.team2Score = value === 1 ? 0 : 1;
    } else {
      m.team2Score = value;
      m.team1Score = value === 1 ? 0 : 1;
    }
    m.saved = false;
  }

  saveResultFor(m: any): void {
    this.http
      .put(`${API_URL}/matches/${m.id}/result`, {
        team1Score: m.team1Score,
        team2Score: m.team2Score,
      })
      .subscribe(() => {
        m.saved = true;
        this.loadData();
        this.loadTable();
        this.loadRecommendations();
      });
  }

  toggleSave(m: any): void {
    if (m.saved) {
      const password = prompt('Passwort zum Bearbeiten eingeben:');
      if (!password) return;
      const username = this.auth.getUser()?.username;
      this.http
        .post(`${API_URL}/auth/login`, { username, password })
        .subscribe({
          next: () => {
            m.saved = false;
          },
          error: () => alert('Passwort falsch'),
        });
    } else {
      this.saveResultFor(m);
    }
  }

  groupStandings(
    gameId: string
  ): Record<string, { teamId: string; points: number }[]> {
    const groups: Record<string, { teamId: string; points: number }[]> = {};
    const matches = this.allMatches.filter(
      (m) => m.gameId === gameId && m.stage === 'group'
    );
    for (const m of matches) {
      const g = m.groupName || 'A';
      groups[g] = groups[g] || [];
      const ensure = (id: string) => {
        if (!groups[g].find((e) => e.teamId === id)) {
          groups[g].push({ teamId: id, points: 0 });
        }
      };
      ensure(m.team1Id);
      ensure(m.team2Id);
      if (m.winnerId) {
        const entry = groups[g].find((e) => e.teamId === m.winnerId);
        if (entry) entry.points += 1;
      }
    }
    for (const g of Object.keys(groups)) {
      groups[g].sort((a, b) => b.points - a.points);
    }
    return groups;
  }

  koMatchesFor(gameId: string): any[] {
    return this.allMatches.filter(
      (m) => m.gameId === gameId && m.stage !== 'group'
    );
  }

  groupPhaseComplete(gameId: string): boolean {
    const matches = this.allMatches.filter(
      (m) => m.gameId === gameId && m.stage === 'group'
    );
    return matches.length > 0 && matches.every((m) => m.winnerId);
  }

  stageLabel(stage: string): string {
    switch (stage) {
      case 'semi_final':
        return 'Halbfinale';
      case 'final':
        return 'Finale';
      case 'third_place':
        return 'Spiel um Platz 3';
      default:
        return stage;
    }
  }

  overallStandings(
    gameId: string
  ): { teamId: string; wins: number; losses: number; ratio: number }[] {
    if (!this.groupPhaseComplete(gameId)) return [];
    const stats: Record<string, { wins: number; losses: number }> = {};
    const matches = this.allMatches.filter(
      (m) => m.gameId === gameId && m.stage === 'group'
    );
    for (const m of matches) {
      stats[m.team1Id] = stats[m.team1Id] || { wins: 0, losses: 0 };
      stats[m.team2Id] = stats[m.team2Id] || { wins: 0, losses: 0 };
      if (m.winnerId) {
        const loser = m.team1Id === m.winnerId ? m.team2Id : m.team1Id;
        stats[m.winnerId].wins += 1;
        stats[loser].losses += 1;
      }
    }

    let table = Object.entries(stats).map(([teamId, s]) => ({
      teamId,
      wins: s.wins,
      losses: s.losses,
      ratio: s.wins + s.losses > 0 ? s.wins / (s.wins + s.losses) : 0,
    }));

    const final = this.allMatches.find(
      (m) => m.gameId === gameId && m.stage === 'final' && m.winnerId
    );
    const third = this.allMatches.find(
      (m) => m.gameId === gameId && m.stage === 'third_place' && m.winnerId
    );

    if (final && third) {
      const finalLoser =
        final.team1Id === final.winnerId ? final.team2Id : final.team1Id;
      const thirdLoser =
        third.team1Id === third.winnerId ? third.team2Id : third.team1Id;
      const ranking = [final.winnerId, finalLoser, third.winnerId, thirdLoser];
      table = ranking
        .map((t) => table.find((e) => e.teamId === t)!)
        .filter(Boolean)
        .concat(table.filter((e) => !ranking.includes(e.teamId)))
        .map((e, idx) => ({ ...e, rank: idx + 1 }));
    } else {
      table.sort((a, b) => b.ratio - a.ratio);
      table = table.map((e, idx) => ({ ...e, rank: idx + 1 }));
    }

    return table;
  }

  createMatch(): void {
    if (
      !this.newMatch.team1Id ||
      !this.newMatch.team2Id ||
      !this.newMatch.gameId
    )
      return;
    const payload = {
      tournamentId: this.tournament?.id,
      gameId: this.newMatch.gameId,
      team1Id: this.newMatch.team1Id,
      team2Id: this.newMatch.team2Id,
    };
    this.http.post(`${API_URL}/matches`, payload).subscribe(() => {
      this.newMatch = { team1Id: '', team2Id: '', gameId: '' };
      this.loadData();
    });
  }

  loadRecommendations(): void {
    this.http.get<any[]>(`${API_URL}/matches/recommendations`).subscribe({
      next: (data) => (this.recommendations = data),
      error: (err) => console.error('Fehler beim Laden der Empfehlungen', err),
    });
  }

  deleteSeason(): void {
    if (!this.team?.seasonId) return;
    const password = prompt('Bitte Passwort zum Löschen eingeben:');
    if (!password) return;
    this.http
      .request('delete', `${API_URL}/seasons/${this.team.seasonId}`, {
        body: { password },
      })
      .subscribe(() => {
        this.seasonActive = false;
        this.loadData();
      });
  }

  finishSeason(): void {
    if (!this.team?.seasonId) return;
    const password = prompt('Bitte Passwort zum Speichern eingeben:');
    if (!password) return;
    this.http
      .post(`${API_URL}/seasons/${this.team.seasonId}/finish`, { password })
      .subscribe(() => {
        this.seasonActive = false;
        this.loadData();
      });
  }
}
