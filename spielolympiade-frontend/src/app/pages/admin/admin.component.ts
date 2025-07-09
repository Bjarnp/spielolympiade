import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  http = inject(HttpClient);

  year = new Date().getFullYear();
  name = 'Spielolympiade ' + this.year;

  users: any[] = [];
  
  matchId = '';
  team1Score = 0;
  team2Score = 0;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.http.get<any[]>(`${API_URL}/users`).subscribe((u) => (this.users = u));
  }

  startSeason(): void {
    this.http
      .post(`${API_URL}/seasons/start`, { year: this.year, name: this.name })
      .subscribe();
  }

  saveResult(): void {
    if (!this.matchId) return;
    this.http
      .put(`${API_URL}/matches/${this.matchId}/result`, {
        team1Score: this.team1Score,
        team2Score: this.team2Score,
      })
      .subscribe();
  }

  changeRole(id: string, role: string): void {
    this.http
      .put(`${API_URL}/users/${id}`, { role })
      .subscribe(() => this.loadUsers());
  }

  deleteUser(id: string): void {
    this.http.delete(`${API_URL}/users/${id}`).subscribe(() => this.loadUsers());
  }
}
