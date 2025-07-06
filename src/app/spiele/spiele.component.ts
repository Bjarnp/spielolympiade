import { Component, OnInit } from '@angular/core';
import { TournamentService } from '../tournament.service';
import { Game } from '../models/game.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-spiele',
  templateUrl: './spiele.component.html',
  styleUrls: ['./spiele.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SpieleComponent implements OnInit {
  games: Game[] = [];
  newGameName: string = '';
  newGameDescription: string = '';

  constructor(private tournamentService: TournamentService) {}

  ngOnInit(): void {
    this.loadGames();
  }

  loadGames(): void {
    this.tournamentService.getGames().subscribe(games => {
      this.games = games;
    });
  }

  createGame(): void {
    if (this.newGameName && this.newGameDescription) {
      const newGame: Game = {
        id: this.generateUniqueId(),
        name: this.newGameName,
        description: this.newGameDescription
      };

      this.tournamentService.addGame(newGame).subscribe(game => {
        this.games.push(game);
        this.newGameName = '';
        this.newGameDescription = '';
      });
    }
  }

  deleteGame(gameId: string): void {
    this.tournamentService.deleteGame(gameId).subscribe(() => {
      this.games = this.games.filter(game => game.id !== gameId);
    });
  }

  generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9); // Generiere eine zufällige ID
  }
}
