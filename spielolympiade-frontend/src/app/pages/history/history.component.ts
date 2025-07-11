import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent {
  http = inject(HttpClient);

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
      this.seasons = data;
    });
  }

  selectSeason(id: string): void {
    this.http
      .get<any>(`${API_URL}/seasons/${id}/history`)
      .subscribe((s) => {
        this.selected = s;
        const matches = this.selected.tournaments[0]?.matches || [];
        this.gameOptions = Array.from(
          new Map(matches.map((m: any) => [m.game.id, m.game])).values()
        );
        this.teamOptions = this.selected.teams;
        this.gameFilter = 'all';
        this.teamFilter = 'all';
        this.updateTable();
      });
  }

  getMemberNames(members: any[]): string {
    return members.map((m: any) => m.user.name).join(', ');
  }

  get filteredMatches(): any[] {
    if (!this.selected) return [];
    let matches = this.selected.tournaments[0]?.matches || [];
    if (this.gameFilter !== 'all') {
      matches = matches.filter((m: any) => m.game.id === this.gameFilter);
    }
    if (this.teamFilter !== 'all') {
      matches = matches.filter(
        (m: any) => m.team1Id === this.teamFilter || m.team2Id === this.teamFilter
      );
    }
    return matches;
  }

  onGameFilterChange(): void {
    this.updateTable();
  }

  updateTable(): void {
    if (!this.selected) {
      this.tableData = [];
      return;
    }
    let matches = this.selected.tournaments[0]?.matches.filter((m: any) => m.winnerId) || [];
    if (this.gameFilter !== 'all') {
      matches = matches.filter((m: any) => m.game.id === this.gameFilter);
    }
    const teams = this.selected.teams;
    const table = teams.map((t: any) => {
      const teamMatches = matches.filter((m: any) => m.team1Id === t.id || m.team2Id === t.id);
      const wins = teamMatches.filter((m: any) => m.winnerId === t.id).length;
      const games = teamMatches.length;
      const losses = games - wins;
      return {
        id: t.id,
        name: t.name,
        spiele: games,
        siege: wins,
        niederlagen: losses,
        points: wins,
      };
    });
    table.sort((a: any, b: any) => b.points - a.points);
    this.tableData = table;
    
  deleteSeason(id: string): void {
    this.http.delete(`${API_URL}/seasons/${id}`).subscribe(() => {
      this.selected = null;
      this.loadSeasons();
    });
  }
}
