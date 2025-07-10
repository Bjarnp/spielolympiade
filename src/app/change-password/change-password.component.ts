import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent {
  newPassword = '';

  constructor(private auth: AuthService, private router: Router) {}

  change(): void {
    this.auth.changePassword(this.newPassword).subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
