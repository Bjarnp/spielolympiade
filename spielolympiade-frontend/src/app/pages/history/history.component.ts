import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent {
  http = inject(HttpClient);

  seasons: any[] = [];
  selected: any = null;

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
      .subscribe((s) => (this.selected = s));
  }

  getMemberNames(members: any[]): string {
    return members.map((m: any) => m.user.name).join(', ');
  }
}
