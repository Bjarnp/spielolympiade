import { Component, inject } from '@angular/core';
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
export class TeamsComponent {
  http = inject(HttpClient);

  teams: any[] = [];

  ngOnInit(): void {
    this.http.get<any[]>(`${API_URL}/teams`).subscribe((data) => {
      this.teams = data;
    });
  }

  getMemberNames(team: any): string {
    return team.members.map((m: any) => m.user.name).join(', ');
  }
}
