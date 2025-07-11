import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AuthService } from './core/auth.service';
import { NgIf } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSlideToggleModule,
    NgIf,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  darkMode = false;

  constructor(public auth: AuthService, private overlayContainer: OverlayContainer) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      this.toggleDarkMode(true);
    }
  }

  logout(): void {
    this.auth.logout();
  }

  toggleDarkMode(isDark: boolean): void {
    this.darkMode = isDark;
    localStorage.setItem('darkMode', `${isDark}`);
    const classList = this.overlayContainer.getContainerElement().classList;
    if (isDark) {
      document.body.classList.add('dark-theme');
      classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
      classList.remove('dark-theme');
    }
  }
}
