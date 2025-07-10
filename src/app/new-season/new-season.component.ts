import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Player } from '../models/player.model';
import { Game } from '../models/game.model';
import { TournamentService } from '../tournament.service';

interface TempTeam {
  name: string;
  playerIds: string[];
}

@Component({
  selector: 'app-new-season',
  templateUrl: './new-season.component.html',
  styleUrls: ['./new-season.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class NewSeasonComponent implements OnInit {
  step = 1;
  players: Player[] = [];
  games: Game[] = [];

  selectedPlayerIds = new Set<string>();
  teams: TempTeam[] = [];
  selectedGameIds = new Set<string>();
  tournamentForms: string[] = ['Liga', 'KO-System', 'Gruppenphase'];
  selectedForm = 'Liga';

  constructor(private tournamentService: TournamentService) {}

  ngOnInit(): void {
    this.tournamentService.getPlayers().subscribe(p => this.players = p);
    this.tournamentService.getGames().subscribe(g => this.games = g);
  }

  togglePlayer(id: string): void {
    if (this.selectedPlayerIds.has(id)) {
      this.selectedPlayerIds.delete(id);
    } else {
      this.selectedPlayerIds.add(id);
    }
  }

  next(): void {
    if (this.step === 1 && this.selectedPlayerIds.size < 2) {
      return;
    }
    if (this.step === 2 && this.teams.length === 0) {
      return;
    }
    this.step++;
  }

  prev(): void {
    if (this.step > 1) {
      this.step--;
    }
  }

  autoTeams(): void {
    const ids = Array.from(this.selectedPlayerIds);
    this.teams = [];
    for (let i = 0; i < ids.length; i += 2) {
      const chunk = ids.slice(i, i + 2);
      this.teams.push({ name: `Team ${this.teams.length + 1}`, playerIds: chunk });
    }
    if (ids.length % 2 === 1 && this.teams.length) {
      this.teams[this.teams.length - 1].playerIds.push(ids[ids.length - 1]);
    }
  }

  createTournament(): void {
    const tournament = {
      teams: this.teams,
      games: Array.from(this.selectedGameIds),
      form: this.selectedForm
    };
    this.tournamentService.createTournament(tournament).subscribe();
  }
}
