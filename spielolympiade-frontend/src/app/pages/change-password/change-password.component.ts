import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent {
  password = '';
  confirm = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    this.error = '';
    if (!this.password || this.password !== this.confirm) {
      this.error = 'Passwörter stimmen nicht überein.';
      return;
    }
    this.auth.changePassword(this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => (this.error = 'Änderung fehlgeschlagen.'),
    });
  }
}
