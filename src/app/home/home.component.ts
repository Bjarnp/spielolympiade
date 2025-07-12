import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../tournament.service';
import { Team } from '../models/team.model';
import { Game } from '../models/game.model';
import { Result } from '../models/result.model';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]  // Importiere hier CommonModule und FormsModule
})
export class HomeComponent implements OnInit, OnDestroy {

  teams: Team[] = [];
  games: Game[] = [];
  ergebnis: string[] = ['Gewonnen', 'Verloren'];

  newResult: Result = {
    id: '',
    gameId: '',
    team1Id: '',
    team2Id: '',
    team1Score: '1',
    team2Score: '0'
  };

  private refreshInterval: any;

  constructor(private tournamentService: TournamentService, public auth: AuthService) { }

  ngOnInit(): void {
    this.loadTeams();
    this.loadGames();
    if (!this.auth.isAdmin()) {
      this.refreshInterval = setInterval(() => {
        this.loadTeams();
        this.loadGames();
      }, 10000);
    }
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
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

  clearAllResults(): void {
    if (confirm('Alle Ergebnisse löschen?')) {
      this.tournamentService.clearAllResults().subscribe(() => {
        this.ngOnInit();
      });
    }
  }
}

