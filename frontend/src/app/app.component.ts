import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PlayerManagementComponent } from './player-management/player-management.component';  // Importiere die Komponente
import { FormsModule, NgModel } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HomeComponent, PlayerManagementComponent, RouterLink],  // Füge die Komponente hinzu
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'spielolympiadeApp';
}
