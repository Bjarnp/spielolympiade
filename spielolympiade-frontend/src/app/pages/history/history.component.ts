import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
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
      });
  }

  // legacy handlers for template bindings
  onGameFilterChange(): void {
    // Angular change detection will update the view automatically
  }

  updateTable(): void {
    // kept for backward compatibility with older templates
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

  deleteSeason(id: string): void {
    this.http.delete(`${API_URL}/seasons/${id}`).subscribe(() => {
      this.selected = null;
      this.loadSeasons();
    });
  }
}
