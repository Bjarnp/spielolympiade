import { Component, OnInit } from '@angular/core';
import { TournamentService } from '../tournament.service';
import { Player } from '../models/player.model';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-player-management',
  templateUrl: './player-management.component.html',
  styleUrls: ['./player-management.component.css'],
  imports: [NgFor, FormsModule, NgIf],
  standalone: true
})
export class PlayerManagementComponent implements OnInit {
  players: Player[] = [];
  newPlayerName: string = '';
  nameError: boolean = false;

  constructor(private tournamentService: TournamentService) {}

  ngOnInit(): void {
    this.loadPlayers();
  }

  loadPlayers(): void {
    this.tournamentService.getPlayers().subscribe(players => {
      this.players = players;
    });
  }

  addPlayer(): void {
    this.nameError = false;
    const duplicate = this.players.some(player => player.name.toLowerCase() === this.newPlayerName.toLowerCase());

    if (duplicate) {
      this.nameError = true;
    } else {
      const newPlayer: Player = {
        id: this.generateUniqueId(), // Dies wird vom Server automatisch generiert
        name: this.newPlayerName,
        teamId: "0" // Standardmäßig kein Team zugewiesen
      };

      this.tournamentService.addPlayer(newPlayer).subscribe(player => {
        this.players.push(player);
        this.newPlayerName = '';
      });
    }
  }

  generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9); // Generiere eine zufällige ID
  }

  removePlayer(playerId: string): void {
    this.tournamentService.deletePlayer(playerId).subscribe(() => {
      this.players = this.players.filter(player => player.id !== playerId);
    });
  }
}
