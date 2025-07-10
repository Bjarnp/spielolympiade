import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  username = '';
  password = '';
  invalid = false;

  constructor(private auth: AuthService, private router: Router) {}

  login(): void {
    this.auth.login(this.username, this.password).subscribe(result => {
      if (result === 'success') {
        this.router.navigate(['/']);
      } else if (result === 'change') {
        this.router.navigate(['/change-password']);
      } else {
        this.invalid = true;
      }
    });
  }
}
