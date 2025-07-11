import { Component, OnInit } from '@angular/core';
import { TournamentService } from '../tournament.service';
import { Game } from '../models/game.model';
import { Result } from '../models/result.model';
import {Team} from '../models/team.model'
import { NgFor } from '@angular/common';
import { TeamNamePipe } from '../team-name.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
  standalone: true,
  imports: [NgFor, FormsModule, TeamNamePipe],
})
export class HistoryComponent implements OnInit {
  results: Result[] = [];
  teams: Team[] = [];
  games: Game[] = [];

  selectedGameId: string = '';
  selectedTeamId: string = '';

  get filteredResults(): Result[] {
    return this.results.filter(result => {
      const matchesGame = this.selectedGameId ? result.gameId === this.selectedGameId : true;
      const matchesTeam = this.selectedTeamId 
        ? result.team1Id === this.selectedTeamId || result.team2Id === this.selectedTeamId 
        : true;
      return matchesGame && matchesTeam;
    });
  }

  constructor(private tournamentService: TournamentService) { }

  ngOnInit(): void {
    this.loadResults();
    this.loadTeams();
    this.loadGames();
  }

  loadResults(): void {
    this.tournamentService.getResults().subscribe(results => {
      this.results = results;
    });
  }

  loadTeams(): void {
    this.tournamentService.getTeams().subscribe(teams => {
      this.teams = teams;
    });
  }

  loadGames(): void {
    this.tournamentService.getGames().subscribe(games => {
      this.games = games;
    });
  }

  getTeamName(teamId: string): string {
    const team = this.teams.find(t => t.id === teamId);
    return team ? team.name : 'Unbekannt';
  }

  getGameName(gameId: string): string {
    const game = this.games.find(g => g.id === gameId);
    return game ? game.name : 'Unbekannt';
  }

  getWinner(result: Result): string {
    return Number(result.team1Score) > Number(result.team2Score)
      ? this.getTeamName(result.team1Id)
      : this.getTeamName(result.team2Id);
  }

  formatResult(result: Result): string {
    const team1 = this.getTeamName(result.team1Id);
    const team2 = this.getTeamName(result.team2Id);
    return `${team1} ${result.team1Score}:${result.team2Score} ${team2}`;
  }

  deleteResult(resultId: string): void {
    const resultToDelete = this.results.find(result => result.id === resultId);
    if (resultToDelete) {
      this.tournamentService.deleteResult(resultId).subscribe(() => {
        this.updateTeamsAfterResultDeletion(resultToDelete);
        this.loadResults();
      });
    }
  }

  updateTeamsAfterResultDeletion(result: Result): void {
    this.tournamentService.updateTeamStatsAfterDeletion(result).subscribe(() => {
      this.loadTeams(); // Aktualisiere die Teams nach dem Löschen eines Ergebnisses
    });
  }
}