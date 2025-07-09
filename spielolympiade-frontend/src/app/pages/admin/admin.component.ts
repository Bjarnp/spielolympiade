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

  users: any[] = [];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.http.get<any[]>(`${API_URL}/users`).subscribe((u) => (this.users = u));
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
