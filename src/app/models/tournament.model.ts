export interface Tournament {
  teams: { name: string; playerIds: string[] }[];
  games: string[];
  form: string;
}
