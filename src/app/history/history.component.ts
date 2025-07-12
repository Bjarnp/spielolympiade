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

  recommendedMatches: { game: Game; team1: Team; team2: Team; playing?: boolean }[] = [];

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
    this.tournamentService.resultsUpdated$.subscribe(() => {
      this.loadResults();
    });
  }

  loadResults(): void {
    this.tournamentService.getResults().subscribe(results => {
      this.results = results;
      this.generateRecommendations();
    });
  }

  loadTeams(): void {
    this.tournamentService.getTeams().subscribe(teams => {
      this.teams = teams;
      this.generateRecommendations();
    });
  }

  loadGames(): void {
    this.tournamentService.getGames().subscribe(games => {
      this.games = games;
      this.generateRecommendations();
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

  startMatch(match: { game: Game; team1: Team; team2: Team; playing?: boolean }): void {
    match.playing = true;
  }

  private generateRecommendations(): void {
    if (!this.results.length || !this.teams.length || !this.games.length) {
      return;
    }

    const counts: Record<string, Record<string, number>> = {};
    this.teams.forEach(t => {
      counts[t.id] = {};
      this.games.forEach(g => counts[t.id][g.id] = 0);
    });
    this.results.forEach(r => {
      counts[r.team1Id][r.gameId]++;
      counts[r.team2Id][r.gameId]++;
    });

    const scheduled = new Set<string>();
    this.recommendedMatches = [];
    this.games.forEach(game => {
      const available = this.teams
        .filter(t => !scheduled.has(t.id))
        .sort((a, b) => counts[a.id][game.id] - counts[b.id][game.id]);
      if (available.length >= 2) {
        const team1 = available[0];
        const team2 = available[1];
        scheduled.add(team1.id);
        scheduled.add(team2.id);
        this.recommendedMatches.push({ game, team1, team2 });
      }
    });
  }
}