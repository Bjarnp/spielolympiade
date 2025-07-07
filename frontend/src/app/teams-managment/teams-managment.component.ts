import { Component, OnInit } from '@angular/core';
import { TournamentService } from '../tournament.service';
import { Team } from '../models/team.model';
import { Player } from '../models/player.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-teams-managment',
  templateUrl: './teams-managment.component.html',
  styleUrls: ['./teams-managment.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]  // Füge diese Module hinzu
})
export class TeamsManagmentComponent implements OnInit {
  teams: Team[] = [];
  players: Player[] = [];
  availablePlayers: Player[] = [];
  newTeamName: string = '';
  selectedPlayer1Id: string | null = null;
  selectedPlayer2Id: string | null = null;

  constructor(private tournamentService: TournamentService) {}

  ngOnInit(): void {
    this.loadTeams();
    this.loadPlayers();
  }

  loadTeams(): void {
    this.tournamentService.getTeams().subscribe(teams => {
      this.teams = teams;
    });
  }

  loadPlayers(): void {
    this.tournamentService.getPlayers().subscribe(players => {
      this.players = players;
      this.updateAvailablePlayers();
    });
  }

  updateAvailablePlayers(): void {
    const assignedPlayerIds = new Set(this.teams.flatMap(team => [team.player1Id, team.player2Id]));
    this.availablePlayers = this.players.filter(player => !assignedPlayerIds.has(player.id));
  }

  getPlayerName(playerId: string | null): string {
    if (!playerId) return 'Kein Spieler';
    const player = this.players.find(p => p.id === playerId);
    return player ? player.name : 'Unbekannt';
  }

  createTeam(): void {
    console.log(this.selectedPlayer1Id)
    if (this.newTeamName && this.selectedPlayer1Id && this.selectedPlayer2Id) {
      const newTeam: Team = {
        id: this.generateUniqueId(), // Generiere eine eindeutige ID
        name: this.newTeamName,
        spiele: '0',
        siege: '0',
        unentschieden: '0',
        niederlagen: '0',
        gt: '0',
        td: '0',
        points: '0',
        letzte5: [],
        player1Id: this.selectedPlayer1Id,
        player2Id: this.selectedPlayer2Id
      };
  
      this.tournamentService.addTeam(newTeam).subscribe(team => {
        this.teams.push(team);
        this.newTeamName = '';
        this.selectedPlayer1Id = null;
        this.selectedPlayer2Id = null;
        this.updateAvailablePlayers();
      });
    }
  }
  
  generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9); // Generiere eine zufällige ID
  }
  

  deleteTeam(teamId: string): void {
    this.tournamentService.deleteTeam(teamId).subscribe(() => {
      this.teams = this.teams.filter(team => team.id !== teamId);
      this.updateAvailablePlayers();
    });
  }
}
