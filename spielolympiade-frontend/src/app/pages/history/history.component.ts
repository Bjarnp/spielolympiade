import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TournamentGameCardComponent } from '../../shared/tournament-game-card/tournament-game-card.component';

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    TournamentGameCardComponent,
  ],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent {
  http = inject(HttpClient);
  auth = inject(AuthService);

  seasons: any[] = [];
  selected: any = null;
  gameFilter = 'all';
  teamFilter = 'all';
  gameOptions: any[] = [];
  teamOptions: any[] = [];
  tableData: any[] = [];

  ngOnInit(): void {
    this.loadSeasons();
  }

  loadSeasons(): void {
    this.http.get<any[]>(`${API_URL}/seasons`).subscribe((data) => {
      this.seasons = data
        .filter((s) => !!s.finishedAt)
        .sort((a, b) => b.year - a.year);
    });
  }

  selectSeason(id: string): void {
    this.http.get<any>(`${API_URL}/seasons/${id}/history`).subscribe((s) => {
      this.selected = s;
      this.gameOptions = Array.from(
        new Map(
          this.getAllMatches().map((m: any) => [m.game.id, m.game]),
        ).values(),
      );
      this.teamOptions = this.selected.teams;
      this.gameFilter = 'all';
      this.teamFilter = 'all';
      this.loadSeasonTable();
    });
  }

  loadSeasonTable(): void {
    if (!this.selected) {
      this.tableData = [];
      return;
    }
    this.http
      .get<any[]>(`${API_URL}/seasons/${this.selected.id}/table`)
      .subscribe({
        next: (data) => {
          this.tableData = data;
        },
        error: (err) => console.error('Fehler beim Laden der Tabelle', err),
      });
  }

  // legacy handlers for template bindings
  onGameFilterChange(): void {
    // Angular change detection will update the view automatically
  }

  getAllMatches(): any[] {
    if (!this.selected) return [];
    return this.selected.tournaments.flatMap((t: any) => t.matches || []);
  }

  get historyGameCount(): number {
    return new Set(
      this.getAllMatches()
        .map((match: any) => match.gameId || match.game?.id)
        .filter(Boolean),
    ).size;
  }

  get historyMatchCount(): number {
    return new Set(
      this.getAllMatches().map((match: any) => match.id).filter(Boolean),
    ).size;
  }

  getGameLabel(gameId: string): string {
    return this.getAllGames().find((g: any) => g.id === gameId)?.name ?? gameId;
  }

  getKnockoutStages(gameId: string): string[] {
    return Array.from(
      new Set(
        this.getAllMatches()
          .filter((m: any) => m.game.id === gameId && m.stage !== 'group')
          .map((m: any) => m.stage),
      ),
    ).sort((a, b) => {
      const order = ['semi_final', 'final', 'third_place', 'extra'];
      return order.indexOf(a) - order.indexOf(b);
    });
  }

  getKnockoutMatches(gameId: string, stage: string): any[] {
    return this.getAllMatches()
      .filter((m: any) => m.game.id === gameId && m.stage === stage)
      .sort((a: any, b: any) =>
        (a.playedAt || '').localeCompare(b.playedAt || ''),
      );
  }

  getMatchScore(match: any, teamId: string): number | null {
    const result = match.results?.find((r: any) => r.teamId === teamId);
    return result?.score ?? null;
  }

  getMatchScoreText(match: any): string {
    const score1 = this.getMatchScore(match, match.team1Id);
    const score2 = this.getMatchScore(match, match.team2Id);
    if (score1 == null || score2 == null) {
      return 'noch offen';
    }
    return `${score1} : ${score2}`;
  }

  getAllGames(): any[] {
    return Array.from(
      new Map(
        this.getAllMatches().map((m: any) => [m.game.id, m.game]),
      ).values(),
    );
  }

  get historyGames(): any[] {
    const games = this.getAllGames();
    return games
      .filter((game: any) => this.gameFilter === 'all' || game.id === this.gameFilter)
      .map((game: any) => {
        const matches = this.getAllMatches().filter((match: any) => match.game.id === game.id);
        const standings = this.buildGameStandings(matches);
        const groups = this.getGroupStandings(game.id);
        const tournament = this.selected.tournaments.find((entry: any) =>
          entry.matches?.some((match: any) => match.game.id === game.id),
        );
        return {
          gameId: game.id,
          gameName: game.name,
          system: tournament?.system || 'round_robin',
          isComplete: matches.length > 0 && matches.every((match: any) => !!match.winnerId),
          standings,
          groupStandings: Object.entries(groups).map(([groupName, rows]) => ({
            groupName,
            standings: rows.map((row, index) => ({
              ...row,
              rank: index + 1,
              teamName: row.name,
            })),
          })),
          knockoutMatches: this.koMatchesFor(game.id).map((match: any) => ({
            ...match,
            team1Name: this.getTeamName(match.team1Id),
            team2Name: this.getTeamName(match.team2Id),
            team1Score: this.getMatchScore(match, match.team1Id),
            team2Score: this.getMatchScore(match, match.team2Id),
          })),
        };
      });
  }

  private buildGameStandings(matches: any[]): any[] {
    const stats = new Map<string, any>();
    for (const match of matches) {
      for (const teamId of [match.team1Id, match.team2Id]) {
        if (!stats.has(teamId)) {
          stats.set(teamId, { teamId, teamName: this.getTeamName(teamId), games: 0, wins: 0, losses: 0, points: 0 });
        }
      }
      if (!match.winnerId) continue;
      const loserId = match.winnerId === match.team1Id ? match.team2Id : match.team1Id;
      const winner = stats.get(match.winnerId);
      const loser = stats.get(loserId);
      winner.games += 1;
      winner.wins += 1;
      loser.games += 1;
      loser.losses += 1;
    }
    return [...stats.values()]
      .sort((a, b) => b.wins - a.wins || a.teamName.localeCompare(b.teamName))
      .map((row, index, rows) => ({ ...row, rank: index + 1, points: rows.length - index - 1 }));
  }

  getMemberNames(members: any[]): string {
    return members.map((m: any) => m.user.name).join(', ');
  }

  getTeamName(id: string): string {
    return this.selected?.teams?.find((t: any) => t.id === id)?.name ?? id;
  }

  get filteredMatches(): any[] {
    if (!this.selected) return [];
    let matches = this.getAllMatches();
    if (this.gameFilter !== 'all') {
      matches = matches.filter((m: any) => m.game.id === this.gameFilter);
    }
    if (this.teamFilter !== 'all') {
      matches = matches.filter(
        (m: any) =>
          m.team1Id === this.teamFilter || m.team2Id === this.teamFilter,
      );
    }
    return matches;
  }

  isGroupKo(): boolean {
    return this.selected?.tournaments?.some(
      (t: any) => t.system === 'group_ko',
    );
  }

  groupNamesFor(gameId: string): string[] {
    const groups = this.getGroupStandings(gameId);
    return Object.keys(groups).sort();
  }

  getGroupStandings(gameId: string): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    const matches = this.getAllMatches().filter(
      (m: any) => m.game.id === gameId && m.stage === 'group',
    );
    for (const m of matches) {
      const group = m.groupName || 'A';
      const ensureTeam = (teamId: string, name: string) => {
        groups[group] = groups[group] || [];
        let entry = groups[group].find((e) => e.teamId === teamId);
        if (!entry) {
          entry = { teamId, name, wins: 0, losses: 0, points: 0 };
          groups[group].push(entry);
        }
        return entry;
      };

      ensureTeam(m.team1Id, this.getTeamName(m.team1Id));
      ensureTeam(m.team2Id, this.getTeamName(m.team2Id));

      if (m.winnerId) {
        const winner = ensureTeam(m.winnerId, this.getTeamName(m.winnerId));
        const loserId = m.team1Id === m.winnerId ? m.team2Id : m.team1Id;
        const loser = ensureTeam(loserId, this.getTeamName(loserId));
        winner.wins += 1;
        loser.losses += 1;
        winner.points += 1;
      }
    }

    for (const key of Object.keys(groups)) {
      groups[key].sort(
        (a, b) => b.points - a.points || a.name.localeCompare(b.name),
      );
    }

    return groups;
  }

  koMatchesFor(gameId: string): any[] {
    return this.getAllMatches().filter(
      (m: any) => m.game.id === gameId && m.stage !== 'group',
    );
  }

  deleteSeason(id: string): void {
    const password = prompt('Bitte Passwort zum Löschen eingeben:');
    if (!password) return;
    this.http
      .request('delete', `${API_URL}/seasons/${id}`, { body: { password } })
      .subscribe(() => {
        this.selected = null;
        this.loadSeasons();
      });
  }
}
