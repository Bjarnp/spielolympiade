import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tournament-game-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './tournament-game-card.component.html',
  styleUrls: ['./tournament-game-card.component.scss'],
})
export class TournamentGameCardComponent {
  @Input() game: any = null;

  get isGroupKo(): boolean {
    return this.game?.system === 'group_ko';
  }

  stageLabel(stage: string | null): string {
    return ({ semi_final: 'Halbfinale', final: 'Finale', third_place: 'Spiel um Platz 3', extra: 'Entscheidungsspiel' } as Record<string, string>)[stage || ''] || 'K.-o.-Phase';
  }

  matchScore(match: any): string {
    if (match.team1Score == null || match.team2Score == null) return 'noch offen';
    return `${match.team1Score} : ${match.team2Score}`;
  }
}
