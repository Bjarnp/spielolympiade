import { Pipe, PipeTransform } from '@angular/core';
import { TournamentService } from './tournament.service';
import { Team } from './models/team.model';

@Pipe({
  name: 'teamName',
  standalone: true
})
export class TeamNamePipe implements PipeTransform {
  private teams: Team[] = [];

  constructor(private tournamentService: TournamentService) {
    this.tournamentService.getTeams().subscribe(t => this.teams = t);
  }

  transform(teamId: string): string {
    const team = this.teams.find(t => t.id === teamId);
    return team ? team.name : teamId;
  }
}
