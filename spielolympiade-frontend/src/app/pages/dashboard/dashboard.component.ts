import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  auth = inject(AuthService);
  http = inject(HttpClient);
  router = inject(Router);

  username = this.auth.getUser()?.username ?? 'Unbekannt';
  team: any;

  ngOnInit(): void {
    this.http.get<any>(`${API_URL}/users/my-team`).subscribe({
      next: (res) => {
        if (res?.error) {
          console.warn('Kein Team vorhanden:', res.error);
          this.team = null;
        } else {
          this.team = res;
        }
      },
      error: (err) => {
        console.error('Fehler beim Laden des Teams', err);
        this.team = null;
      },
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
