import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Team } from './models/team.model';
import { Player } from './models/player.model';
import { Game } from './models/game.model';
import { Result} from './models/result.model'


@Injectable({
  providedIn: 'root'
})
export class TournamentService {

  teams: Team[] = [];
  games: Game[] = [];

  private apiUrl = 'http://localhost:3000';  // URL zu deinem JSON-Server
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient) { }

  // Teams
  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.apiUrl}/teams`);
  }

  addTeam(team: Team): Observable<Team> {
    console.log(team.id);
    return this.http.post<Team>(`${this.apiUrl}/teams`, team);
  }

  deleteTeam(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teams/${id}`);
  }
  


  // Players
  getPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.apiUrl}/players`);
  }

  addPlayer(player: Player): Observable<Player> {
    return this.http.post<Player>(`${this.apiUrl}/players`, player);
  }

  deletePlayer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/players/${id}`);
  }





  // Games
  getGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/games`);
  }

  addGame(game: Game): Observable<Game> {
    return this.http.post<Game>(`${this.apiUrl}/games`, game);
  }

  deleteGame(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/games/${id}`);
  }

  
  //Results
  getResults(): Observable<Result[]> {
    return this.http.get<Result[]>(`${this.apiUrl}/results`);
  }

  addResult(result: Result): Observable<Result> {
    return this.http.post<Result>(`${this.apiUrl}/results`, result, this.httpOptions).pipe(
        switchMap(newResult => {
            return this.updateTeamStats(newResult).pipe(
                map(() => newResult)
            );
        })
    );
}

  updateResult(result: Result): Observable<Result> {
    result.id = result.id.toString();
    result.gameId = result.gameId.toString();
    result.team1Id = result.team1Id.toString();
    result.team2Id = result.team2Id.toString();
    result.team1Score = result.team1Score.toString();
    result.team2Score = result.team2Score.toString();
    return this.http.put<Result>(`${this.apiUrl}/results/${result.id}`, result, this.httpOptions);
  }

  private updateTeamStats(result: Result): Observable<void> {
    return this.getTeams().pipe(
        switchMap(teams => {
            const team1 = teams.find(t => t.id === result.team1Id);
            const team2 = teams.find(t => t.id === result.team2Id);

            if (team1 && team2) {
                // Team 1 aktualisieren
                team1.spiele = (+team1.spiele + 1).toString();
                team1.gt = (+team1.gt + +result.team1Score).toString();
                team1.td = (+team1.td + (+result.team1Score - +result.team2Score)).toString();

                // Team 2 aktualisieren
                team2.spiele = (+team2.spiele + 1).toString();
                team2.gt = (+team2.gt + +result.team2Score).toString();
                team2.td = (+team2.td + (+result.team2Score - +result.team1Score)).toString();

                // Ergebnis verarbeiten
                if (+result.team1Score > +result.team2Score) {
                    team1.siege = (+team1.siege + 1).toString();
                    team1.points = (+team1.points + 1).toString();

                    team2.niederlagen = (+team2.niederlagen + 1).toString();
                } else if (+result.team1Score < +result.team2Score) {
                    team2.siege = (+team2.siege + 1).toString();
                    team2.points = (+team2.points + 1).toString();

                    team1.niederlagen = (+team1.niederlagen + 1).toString();
                } else {
                    team1.unentschieden = (+team1.unentschieden + 1).toString();
                    team1.points = (+team1.points + 1).toString();

                    team2.unentschieden = (+team2.unentschieden + 1).toString();
                    team2.points = (+team2.points + 1).toString();
                }

                // "Letzte 5" aktualisieren
                team1.letzte5.push(+result.team1Score > +result.team2Score ? 'S' : (+result.team1Score < +result.team2Score ? 'N' : 'U'));
                team2.letzte5.push(+result.team2Score > +result.team1Score ? 'S' : (+result.team2Score < +result.team1Score ? 'N' : 'U'));

                // Nur die letzten 5 Spiele in der "letzte5"-Liste behalten
                team1.letzte5 = team1.letzte5.slice(-5);
                team2.letzte5 = team2.letzte5.slice(-5);

                // Aktualisierte Teams speichern
                const team1Update = this.http.put(`${this.apiUrl}/teams/${team1.id}`, team1, this.httpOptions);
                const team2Update = this.http.put(`${this.apiUrl}/teams/${team2.id}`, team2, this.httpOptions);

                return new Observable<void>(observer => {
                    team1Update.subscribe(() => {
                        team2Update.subscribe(() => {
                            observer.next();
                            observer.complete();
                        });
                    });
                });
            } else {
                return new Observable<void>(observer => {
                    observer.error('Teams not found');
                    observer.complete();
                });
            }
        })
    );
}
deleteResult(id: string): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/results/${id}`);
}

updateTeamStatsAfterDeletion(result: Result): Observable<void> {
  return this.getTeams().pipe(
    switchMap(teams => {
      const team1 = teams.find(t => t.id === result.team1Id);
      const team2 = teams.find(t => t.id === result.team2Id);

      if (team1 && team2) {
        // Team 1 aktualisieren
        team1.spiele = (+team1.spiele - 1).toString();
        team1.gt = (+team1.gt - +result.team1Score).toString();
        team1.td = (+team1.td - (+result.team1Score - +result.team2Score)).toString();

        // Team 2 aktualisieren
        team2.spiele = (+team2.spiele - 1).toString();
        team2.gt = (+team2.gt - +result.team2Score).toString();
        team2.td = (+team2.td - (+result.team2Score - +result.team1Score)).toString();

        // Ergebnis verarbeiten
        if (+result.team1Score > +result.team2Score) {
          team1.siege = (+team1.siege - 1).toString();
          team1.points = (+team1.points - 1).toString();

          team2.niederlagen = (+team2.niederlagen - 1).toString();
        } else {
          team2.siege = (+team2.siege - 1).toString();
          team2.points = (+team2.points - 1).toString();

          team1.niederlagen = (+team1.niederlagen - 1).toString();
        }

        // "Letzte 5" aktualisieren
        team1.letzte5.pop();
        team2.letzte5.pop();

        // Aktualisierte Teams speichern
        const team1Update = this.http.put(`${this.apiUrl}/teams/${team1.id}`, team1, this.httpOptions);
        const team2Update = this.http.put(`${this.apiUrl}/teams/${team2.id}`, team2, this.httpOptions);

        return new Observable<void>(observer => {
          team1Update.subscribe(() => {
            team2Update.subscribe(() => {
              observer.next();
              observer.complete();
            });
          });
        });
      } else {
        return new Observable<void>(observer => {
          observer.error('Teams not found');
          observer.complete();
        });
      }
    })
  );
}

  clearAllResults(): Observable<void> {
    return this.getResults().pipe(
      switchMap(results => {
        if (results.length === 0) {
          return of(void 0);
        }
        const ops = results.map(r =>
          this.deleteResult(r.id).pipe(
            switchMap(() => this.updateTeamStatsAfterDeletion(r))
          )
        );
        return forkJoin(ops).pipe(map(() => void 0));
      })
    );
  }

}
