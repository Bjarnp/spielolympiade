import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule],
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss'],
})
export class TeamsComponent implements OnInit, OnDestroy {
  http = inject(HttpClient);

  teams: any[] = [];

  private refreshInterval: any;

  ngOnInit(): void {
    this.loadTeams();
    this.refreshInterval = setInterval(() => this.loadTeams(), 10000);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshInterval);
  }

  loadTeams(): void {
    this.http.get<any[]>(`${API_URL}/teams`).subscribe((data) => {
      this.teams = data;
    });
  }

  getMemberNames(team: any): string {
    return team.members.map((m: any) => m.user.name).join(', ');
  }
}
