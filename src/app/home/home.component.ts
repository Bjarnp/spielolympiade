import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../tournament.service';
import { Team } from '../models/team.model';
import { Game } from '../models/game.model';
import { Result } from '../models/result.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]  // Importiere hier CommonModule und FormsModule
})
export class HomeComponent implements OnInit {

  teams: Team[] = [];
  games: Game[] = [];
  results: Result[] = [];
  filter: 'all' | 'open' | 'completed' = 'all';
  showOwn = false;
  currentTeamId = '';
  ergebnis: string[] = ['Gewonnen', 'Verloren'];

  newResult: Result = {
    id: '',
    gameId: '',
    team1Id: '',
    team2Id: '',
    team1Score: '1',
    team2Score: '0'
  };

  constructor(private tournamentService: TournamentService) { }

  ngOnInit(): void {
    this.loadTeams();
    this.loadGames();
    this.loadResults();
  }

 
  loadTeams(): void {
    this.tournamentService.getTeams().subscribe(teams => {
        this.teams = teams.sort((a, b) => {
            const pointsDifference = Number(b.points) - Number(a.points);
            if (pointsDifference !== 0) {
                return pointsDifference;
            } else {
                return Number(a.spiele) - Number(b.spiele); // Sortiere nach Anzahl der Spiele, falls Punkte gleich sind
            }
        });
    });
}



  loadGames(): void {
    this.tournamentService.getGames().subscribe(games => {
      this.games = games;
    });
  }

  loadResults(): void {
    this.tournamentService.getResults().subscribe(r => this.results = r);
  }

  get filteredResults(): Result[] {
    let res = this.results;
    if (this.showOwn && this.currentTeamId) {
      res = res.filter(r => r.team1Id === this.currentTeamId || r.team2Id === this.currentTeamId);
    }
    if (this.filter === 'completed') {
      return res; // all stored results are completed
    }
    if (this.filter === 'open') {
      return []; // no open matches handled
    }
    return res;
  }

  addResult(): void {
    this.newResult.id = this.generateUniqueId();
    this.tournamentService.addResult(this.newResult).subscribe(result => {
      console.log('Result added:', result);
      this.resetForm();
      this.ngOnInit();
    });
}

  

  resetForm(): void {
    this.newResult = {
      id: '',
      gameId: '',
      team1Id: '',
      team2Id: '',
      team1Score: '1',
      team2Score: '0'
    };
  }

  generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  onScoreSelect(changedTeam: string): void {
    if (changedTeam === 'team1') {
        // Wenn team1 als Gewinner ausgewählt wurde, setze team2 als Verlierer und umgekehrt
        if (this.newResult.team1Score === '1') {
            this.newResult.team2Score = '0';
        } else {
            this.newResult.team2Score = '1';
        }
    } else if (changedTeam === 'team2') {
        if (this.newResult.team2Score === '1') {
            this.newResult.team1Score = '0';
        } else {
            this.newResult.team1Score = '1';
        }
    }
}

}
