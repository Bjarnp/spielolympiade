import { prisma } from "../lib/prisma";

type MatchResult = {
  teamId: string;
  score: number | null;
  comment: string | null;
};

type InputMatch = {
  id: string;
  tournamentId: string;
  gameId: string;
  stage: string | null;
  groupName: string | null;
  team1Id: string;
  team2Id: string;
  winnerId: string | null;
  scheduledAt: Date | string | null;
  playedAt: Date | string | null;
  game: { id: string; name: string };
  results: MatchResult[];
  team1: { id: string; name: string };
  team2: { id: string; name: string };
  winner: { id: string; name: string } | null;
};

type TeamMember = { user: { id: string; name: string } };

type TeamWithMembers = {
  id: string;
  name: string;
  members: TeamMember[];
};

type TournamentWithMatches = {
  id: string;
  system: string;
  location: string | null;
  matches: InputMatch[];
};

type GroupKoMatchInput = {
  id: string;
  tournamentId: string;
  gameId: string;
  stage: string | null;
  groupName: string | null;
  team1Id: string;
  team2Id: string;
  winnerId: string | null;
  scheduledAt: Date | string | null;
  playedAt: Date | string | null;
  game?: { id: string; name: string };
  results?: MatchResult[];
  team1?: { id: string; name: string };
  team2?: { id: string; name: string };
  winner?: { id: string; name: string } | null;
};

export type TeamStats = {
  teamId: string;
  teamName: string;
  players: string[];
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  scoreFor: number;
  scoreAgainst: number;
  scoreDiff: number;
  headToHead: Record<string, number>;
  points: number;
  rank: number;
  isCertain: boolean;
};

export type HistoryMatch = {
  id: string;
  tournamentId: string;
  gameId: string;
  gameName: string;
  stage: string | null;
  groupName: string | null;
  team1Id: string;
  team2Id: string;
  team1Name: string;
  team2Name: string;
  winnerId: string | null;
  winnerName: string | null;
  scheduledAt: string | null;
  playedAt: string | null;
  team1Score: number | null;
  team2Score: number | null;
  comment: string | null;
  isPlayed: boolean;
};

export type SeasonGameSummary = {
  tournamentId: string;
  gameId: string;
  gameName: string;
  system: string;
  location: string | null;
  matchCount: number;
  isComplete: boolean;
  standings: TeamStats[];
  groupStandings?: { groupName: string; standings: TeamStats[] }[];
  knockoutMatches?: HistoryMatch[];
  matches: HistoryMatch[];
};

export type SeasonDetail = {
  id: string;
  year: number;
  name: string;
  finishedAt: string;
  tournamentSystems: string[];
  location: string | null;
  teamCount: number;
  playerCount: number;
  gameCount: number;
  matchCount: number;
  champion: { teamId: string; teamName: string; players: string[] } | null;
  isComplete: boolean;
  overallStandings: TeamStats[];
  games: SeasonGameSummary[];
  matches: HistoryMatch[];
};

export type SeasonSummary = {
  id: string;
  year: number;
  name: string;
  finishedAt: string;
  tournamentSystems: string[];
  location: string | null;
  teamCount: number;
  playerCount: number;
  gameCount: number;
  matchCount: number;
  champion: { teamId: string; teamName: string; players: string[] } | null;
  isComplete: boolean;
};

export type PlayerStatsSummary = {
  playerId: string;
  playerName: string;
  seasons: number;
  wonSeasons: number;
  podiums: number;
  averagePlacement: number;
  bestPlacement: number;
  worstPlacement: number;
  averageGamePlacement: number;
  matchCount: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPlacementPoints: number;
  averagePlacementPoints: number;
  teamNames: string[];
};

export type PlayerStatsDetail = PlayerStatsSummary & {
  seasonsDetail: {
    seasonId: string;
    seasonName: string;
    seasonYear: number;
    teamName: string;
    teammates: string[];
    placement: number;
    points: number;
    isChampion: boolean;
    games: {
      gameId: string;
      gameName: string;
      system: string;
      placement: number;
      points: number;
      wins: number;
      losses: number;
    }[];
  }[];
  matches: {
    id: string;
    seasonId: string;
    seasonName: string;
    gameId: string;
    gameName: string;
    stage: string | null;
    groupName: string | null;
    teamName: string;
    opponentName: string;
    result: string;
    winnerId: string | null;
    playedAt: string | null;
    scheduledAt: string | null;
    comment: string | null;
  }[];
};


export function calculatePlacementPoints(
  place: number,
  totalTeams: number,
): number {
  return Math.max(totalTeams - place, 0);
}

function dateToISOString(value: Date | string | null): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

function normalizeMatch(match: InputMatch): HistoryMatch {
  const team1Score =
    match.results.find((r) => r.teamId === match.team1Id)?.score ?? null;
  const team2Score =
    match.results.find((r) => r.teamId === match.team2Id)?.score ?? null;
  const comment =
    match.results.find((r) => r.teamId === match.team1Id)?.comment ??
    match.results.find((r) => r.teamId === match.team2Id)?.comment ??
    null;

  return {
    id: match.id,
    tournamentId: match.tournamentId,
    gameId: match.gameId,
    gameName: match.game.name,
    stage: match.stage,
    groupName: match.groupName,
    team1Id: match.team1Id,
    team2Id: match.team2Id,
    team1Name: match.team1.name,
    team2Name: match.team2.name,
    winnerId: match.winnerId,
    winnerName: match.winner?.name ?? null,
    scheduledAt: dateToISOString(match.scheduledAt),
    playedAt: dateToISOString(match.playedAt),
    team1Score,
    team2Score,
    comment,
    isPlayed: !!match.winnerId,
  };
}

function buildTeamPlayers(teams: TeamWithMembers[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const team of teams) {
    map[team.id] = team.members
      .map((member) => member.user.name)
      .filter((name) => !!name);
  }
  return map;
}

function createBaseTeamStats(
  teamPlayers: Record<string, string[]>,
  teamNames: Record<string, string>,
): Record<string, TeamStats> {
  const stats: Record<string, TeamStats> = {};
  for (const [teamId, players] of Object.entries(teamPlayers)) {
    stats[teamId] = {
      teamId,
      teamName: teamNames[teamId] ?? teamId,
      players,
      games: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      scoreFor: 0,
      scoreAgainst: 0,
      scoreDiff: 0,
      headToHead: {},
      points: 0,
      rank: 0,
      isCertain: true,
    };
  }
  return stats;
}

function sortTeamStats(stats: TeamStats[]): TeamStats[] {
  return [...stats].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const headToHead =
      (b.headToHead[a.teamId] || 0) - (a.headToHead[b.teamId] || 0);
    if (headToHead !== 0) return headToHead;
    if (b.scoreDiff !== a.scoreDiff) return b.scoreDiff - a.scoreDiff;
    const nameCompare = a.teamName.localeCompare(b.teamName);
    if (nameCompare !== 0) return nameCompare;
    return a.teamId.localeCompare(b.teamId);
  });
}

function computeTeamStats(
  matches: HistoryMatch[],
  teamPlayers: Record<string, string[]>,
  teamNames: Record<string, string>,
): { stats: TeamStats[]; isComplete: boolean } {
  const statsMap = createBaseTeamStats(teamPlayers, teamNames);
  let isComplete = true;

  for (const match of matches) {
    const team1 = statsMap[match.team1Id];
    const team2 = statsMap[match.team2Id];
    if (!team1 || !team2) continue;
    if (!match.winnerId) {
      isComplete = false;
      continue;
    }

    team1.games += 1;
    team2.games += 1;
    const winner = match.winnerId === match.team1Id ? team1 : team2;
    const loser = winner === team1 ? team2 : team1;
    winner.wins += 1;
    loser.losses += 1;
    winner.headToHead[loser.teamId] =
      (winner.headToHead[loser.teamId] || 0) + 1;
    loser.headToHead[winner.teamId] = loser.headToHead[winner.teamId] || 0;

    const score1 = match.team1Score ?? 0;
    const score2 = match.team2Score ?? 0;
    team1.scoreFor += score1;
    team1.scoreAgainst += score2;
    team2.scoreFor += score2;
    team2.scoreAgainst += score1;
    team1.scoreDiff = team1.scoreFor - team1.scoreAgainst;
    team2.scoreDiff = team2.scoreFor - team2.scoreAgainst;
  }

  const totals = Object.values(statsMap);
  for (const stat of totals) {
    stat.winRate = stat.games > 0 ? stat.wins / stat.games : 0;
  }

  return { stats: totals, isComplete };
}

function buildRoundRobinStandings(
  matches: HistoryMatch[],
  teamPlayers: Record<string, string[]>,
  teamNames: Record<string, string>,
): {
  standings: TeamStats[];
  isComplete: boolean;
  groupStandings?: { groupName: string; standings: TeamStats[] }[];
  knockoutMatches?: HistoryMatch[];
} {
  const { stats, isComplete } = computeTeamStats(
    matches,
    teamPlayers,
    teamNames,
  );
  const sorted = sortTeamStats(stats);
  const totalTeams = sorted.length;
  return {
    standings: sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      points: calculatePlacementPoints(index + 1, totalTeams),
      isCertain: isComplete,
    })),
    isComplete,
    groupStandings: undefined,
    knockoutMatches: undefined,
  };
}

function buildGroupStandings(
  matches: HistoryMatch[],
  teamPlayers: Record<string, string[]>,
  teamNames: Record<string, string>,
): { groupName: string; standings: TeamStats[] }[] {
  const grouped: Record<string, HistoryMatch[]> = {};
  for (const match of matches) {
    const group = match.groupName || "A";
    grouped[group] = grouped[group] || [];
    grouped[group].push(match);
  }

  return Object.keys(grouped)
    .sort()
    .map((groupName) => {
      const { stats } = computeTeamStats(
        grouped[groupName],
        teamPlayers,
        teamNames,
      );
      const sorted = sortTeamStats(stats).map((entry, index) => ({
        ...entry,
        rank: index + 1,
        points: calculatePlacementPoints(index + 1, stats.length),
      }));
      return { groupName, standings: sorted };
    });
}

function buildGroupKoStandings(
  matches: HistoryMatch[],
  teamPlayers: Record<string, string[]>,
  teamNames: Record<string, string>,
): {
  standings: TeamStats[];
  groupStandings: { groupName: string; standings: TeamStats[] }[];
  knockoutMatches: HistoryMatch[];
  isComplete: boolean;
} {
  const groupMatches = matches.filter((match) => match.stage === "group");
  const nonGroupMatches = matches.filter((match) => match.stage !== "group");
  const groupStandings = buildGroupStandings(
    groupMatches,
    teamPlayers,
    teamNames,
  );
  const allTeamIds = Array.from(
    new Set(matches.flatMap((match) => [match.team1Id, match.team2Id])),
  );
  const teamNamesMap = teamNames;

  const finalMatch = matches.find((match) => match.stage === "final");
  const thirdMatch = matches.find((match) => match.stage === "third_place");
  const allMatchesComplete = matches.every((match) => match.winnerId);
  const isComplete = allMatchesComplete && !!finalMatch && !!thirdMatch;

  const groupRank = new Map<string, number>();
  for (const group of groupStandings) {
    for (const entry of group.standings) {
      groupRank.set(entry.teamId, entry.rank);
    }
  }

  const rankByTeam = new Map<string, { rank: number; isCertain: boolean }>();
  const pushRank = (teamId: string, rank: number, isCertain: boolean) => {
    const existing = rankByTeam.get(teamId);
    if (!existing || rank < existing.rank) {
      rankByTeam.set(teamId, { rank, isCertain });
    }
  };

  if (finalMatch && finalMatch.winnerId) {
    const finalLoser =
      finalMatch.team1Id === finalMatch.winnerId
        ? finalMatch.team2Id
        : finalMatch.team1Id;
    pushRank(finalMatch.winnerId, 1, true);
    pushRank(finalLoser, 2, true);
  }
  if (thirdMatch && thirdMatch.winnerId) {
    const thirdLoser =
      thirdMatch.team1Id === thirdMatch.winnerId
        ? thirdMatch.team2Id
        : thirdMatch.team1Id;
    pushRank(thirdMatch.winnerId, 3, true);
    pushRank(thirdLoser, 4, true);
  }

  const overallRanks = Array.from(rankByTeam.entries())
    .map(([teamId, info]) => ({
      teamId,
      rank: info.rank,
      isCertain: info.isCertain,
    }))
    .sort((a, b) => a.rank - b.rank);
  const rankedTeamIds = new Set(overallRanks.map((item) => item.teamId));
  const remainingTeamIds = allTeamIds.filter((id) => !rankedTeamIds.has(id));
  const remainingMatches = matches.filter(
    (match) =>
      remainingTeamIds.includes(match.team1Id) &&
      remainingTeamIds.includes(match.team2Id),
  );
  const { stats: remainingStats } = computeTeamStats(
    remainingMatches,
    teamPlayers,
    teamNamesMap,
  );
  const sortedRemaining = sortTeamStats(remainingStats).sort((a, b) => {
    const rankA = groupRank.get(a.teamId) ?? Number.MAX_SAFE_INTEGER;
    const rankB = groupRank.get(b.teamId) ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    return 0;
  });

  let nextRank = overallRanks.length + 1;
  for (const entry of sortedRemaining) {
    overallRanks.push({
      teamId: entry.teamId,
      rank: nextRank++,
      isCertain: groupMatches.every((m) => m.winnerId),
    });
  }

  const teamStats = createBaseTeamStats(teamPlayers, teamNamesMap);
  for (const match of matches) {
    const team1 = teamStats[match.team1Id];
    const team2 = teamStats[match.team2Id];
    if (!team1 || !team2) continue;
    if (!match.winnerId) continue;
    team1.games += 1;
    team2.games += 1;
    const winner = match.winnerId === match.team1Id ? team1 : team2;
    const loser = winner === team1 ? team2 : team1;
    winner.wins += 1;
    loser.losses += 1;
    winner.headToHead[loser.teamId] =
      (winner.headToHead[loser.teamId] || 0) + 1;
    loser.headToHead[winner.teamId] = loser.headToHead[winner.teamId] || 0;
    const score1 = match.team1Score ?? 0;
    const score2 = match.team2Score ?? 0;
    team1.scoreFor += score1;
    team1.scoreAgainst += score2;
    team2.scoreFor += score2;
    team2.scoreAgainst += score1;
    team1.scoreDiff = team1.scoreFor - team1.scoreAgainst;
    team2.scoreDiff = team2.scoreFor - team2.scoreAgainst;
  }
  for (const stat of Object.values(teamStats)) {
    stat.winRate = stat.games > 0 ? stat.wins / stat.games : 0;
  }

  const orderedStats = overallRanks
    .map((rankInfo) => {
      const stat = teamStats[rankInfo.teamId];
      if (!stat) return null;
      return {
        ...stat,
        rank: rankInfo.rank,
        points: calculatePlacementPoints(rankInfo.rank, allTeamIds.length),
        isCertain:
          rankInfo.isCertain &&
          groupMatches.every((m) => m.winnerId) &&
          (!finalMatch || !!finalMatch.winnerId) &&
          (!thirdMatch || !!thirdMatch.winnerId),
      };
    })
    .filter((stat): stat is TeamStats => Boolean(stat));

  return {
    standings: orderedStats,
    groupStandings,
    knockoutMatches: nonGroupMatches,
    isComplete,
  };
}

export function calculateGroupKoStandings(
  matches: GroupKoMatchInput[],
): {
  teamId: string;
  teamName: string;
  rank: number;
  points: number;
  isCertain: boolean;
}[] {
  const normalizedMatches = matches.map((match) =>
    normalizeMatch({
      ...match,
      game: match.game ?? { id: match.gameId, name: match.gameId },
      results: match.results ?? [],
      team1: match.team1 ?? { id: match.team1Id, name: match.team1Id },
      team2: match.team2 ?? { id: match.team2Id, name: match.team2Id },
      winner: match.winner ?? null,
    }),
  );

  const teamIds = Array.from(
    new Set(
      normalizedMatches.flatMap((match) => [match.team1Id, match.team2Id]),
    ),
  );
  const teamNames = Object.fromEntries(
    teamIds.map((teamId) => [teamId, teamId]),
  );
  const teamPlayers = Object.fromEntries(
    teamIds.map((teamId) => [teamId, [] as string[]]),
  );
  const standings = buildGroupKoStandings(
    normalizedMatches,
    teamPlayers,
    teamNames,
  ).standings;
  return standings.map((standing) => ({
    teamId: standing.teamId,
    teamName: standing.teamName,
    rank: standing.rank,
    points: standing.points,
    isCertain: standing.isCertain,
  }));
}

export function buildSeasonSummary(season: {
  id: string;
  year: number;
  name: string;
  finishedAt: Date | string | null;
  teams: TeamWithMembers[];
  tournaments: TournamentWithMatches[];
}): SeasonSummary {
  const allMatches = season.tournaments.flatMap((tournament) =>
    tournament.matches.map(normalizeMatch),
  );
  const allTeamPlayers = buildTeamPlayers(season.teams);
  const teamNames: Record<string, string> = Object.fromEntries(
    season.teams.map((team) => [team.id, team.name]),
  );
  const gameSummaries = buildSeasonGames(
    season.tournaments,
    allTeamPlayers,
    teamNames,
  );
  const overallStandings = buildOverallStandings(
    allMatches,
    allTeamPlayers,
    teamNames,
    gameSummaries,
  );
  const champion =
    overallStandings[0]?.rank === 1 && overallStandings[0]?.isCertain
      ? {
          teamId: overallStandings[0].teamId,
          teamName: overallStandings[0].teamName,
          players: overallStandings[0].players,
        }
      : null;

  return {
    id: season.id,
    year: season.year,
    name: season.name,
    finishedAt: new Date(season.finishedAt as string | Date).toISOString(),
    tournamentSystems: Array.from(
      new Set(season.tournaments.map((t) => t.system)),
    ),
    location:
      Array.from(
        new Set(season.tournaments.map((t) => t.location).filter(Boolean)),
      ).join(", ") || null,
    teamCount: season.teams.length,
    playerCount: new Set(
      season.teams.flatMap((team) =>
        team.members.map((member) => member.user.id),
      ),
    ).size,
    gameCount: new Set(allMatches.map((match) => match.gameId)).size,
    matchCount: allMatches.length,
    champion,
    isComplete: gameSummaries.every((game) => game.isComplete),
  };
}

function buildSeasonGames(
  tournaments: TournamentWithMatches[],
  teamPlayers: Record<string, string[]>,
  teamNames: Record<string, string>,
): SeasonGameSummary[] {
  const gameBuckets: Record<
    string,
    { tournament: TournamentWithMatches; matches: HistoryMatch[] }
  > = {};
  for (const tournament of tournaments) {
    for (const match of tournament.matches) {
      const key = `${tournament.id}_${match.gameId}`;
      gameBuckets[key] = gameBuckets[key] || { tournament, matches: [] };
      gameBuckets[key].matches.push(normalizeMatch(match));
    }
  }

  return Object.values(gameBuckets).map((bucket) => {
    const tournament = bucket.tournament;
    const matches = bucket.matches;
    const system = tournament.system;
    const { standings, isComplete, groupStandings, knockoutMatches } =
      system === "group_ko"
        ? buildGroupKoStandings(matches, teamPlayers, teamNames)
        : buildRoundRobinStandings(matches, teamPlayers, teamNames);

    return {
      tournamentId: tournament.id,
      gameId: matches[0]?.gameId ?? "",
      gameName: matches[0]?.gameName ?? "Unbekannt",
      system,
      location: tournament.location,
      matchCount: matches.length,
      isComplete,
      standings,
      groupStandings: groupStandings?.length ? groupStandings : undefined,
      knockoutMatches: knockoutMatches?.length ? knockoutMatches : undefined,
      matches,
    };
  });
}

function buildOverallStandings(
  matches: HistoryMatch[],
  teamPlayers: Record<string, string[]>,
  teamNames: Record<string, string>,
  gameSummaries?: SeasonGameSummary[],
): TeamStats[] {
  const { stats, isComplete } = computeTeamStats(
    matches,
    teamPlayers,
    teamNames,
  );
  const pointsByTeam: Record<string, number> = {};
  const overallIsCertain =
    isComplete &&
    (!gameSummaries || gameSummaries.every((game) => game.isComplete));

  if (gameSummaries) {
    for (const game of gameSummaries) {
      for (const standing of game.standings) {
        pointsByTeam[standing.teamId] =
          (pointsByTeam[standing.teamId] || 0) + standing.points;
      }
    }
  } else {
    const totalTeams = stats.length;
    const ranked = sortTeamStats(stats).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
    for (const entry of ranked) {
      pointsByTeam[entry.teamId] = calculatePlacementPoints(
        entry.rank,
        totalTeams,
      );
    }
  }

  const sorted = [...stats].sort((a, b) => {
    const aPoints = pointsByTeam[a.teamId] || 0;
    const bPoints = pointsByTeam[b.teamId] || 0;
    if (bPoints !== aPoints) return bPoints - aPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    const headToHead =
      (b.headToHead[a.teamId] || 0) - (a.headToHead[b.teamId] || 0);
    if (headToHead !== 0) return headToHead;
    if (b.scoreDiff !== a.scoreDiff) return b.scoreDiff - a.scoreDiff;
    const nameCompare = a.teamName.localeCompare(b.teamName);
    if (nameCompare !== 0) return nameCompare;
    return a.teamId.localeCompare(b.teamId);
  });

  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    points: pointsByTeam[entry.teamId] || 0,
    isCertain: overallIsCertain,
  }));
}

export function buildSeasonDetail(season: {
  id: string;
  year: number;
  name: string;
  finishedAt: Date | string | null;
  teams: TeamWithMembers[];
  tournaments: TournamentWithMatches[];
}): SeasonDetail {
  const allMatches = season.tournaments.flatMap((tournament) =>
    tournament.matches.map(normalizeMatch),
  );
  const teamPlayers = buildTeamPlayers(season.teams);
  const teamNames: Record<string, string> = Object.fromEntries(
    season.teams.map((team) => [team.id, team.name]),
  );
  const games = buildSeasonGames(season.tournaments, teamPlayers, teamNames);
  const overallStandings = buildOverallStandings(
    allMatches,
    teamPlayers,
    teamNames,
    games,
  );
  const isComplete = games.every((game) => game.isComplete);
  const champion =
    overallStandings[0]?.rank === 1 && overallStandings[0]?.isCertain
      ? {
          teamId: overallStandings[0].teamId,
          teamName: overallStandings[0].teamName,
          players: overallStandings[0].players,
        }
      : null;

  return {
    id: season.id,
    year: season.year,
    name: season.name,
    finishedAt: new Date(season.finishedAt as string | Date).toISOString(),
    tournamentSystems: Array.from(
      new Set(season.tournaments.map((t) => t.system)),
    ),
    location:
      Array.from(
        new Set(season.tournaments.map((t) => t.location).filter(Boolean)),
      ).join(", ") || null,
    teamCount: season.teams.length,
    playerCount: new Set(
      season.teams.flatMap((team) =>
        team.members.map((member) => member.user.id),
      ),
    ).size,
    gameCount: new Set(allMatches.map((match) => match.gameId)).size,
    matchCount: allMatches.length,
    champion,
    isComplete,
    overallStandings,
    games,
    matches: allMatches,
  };
}

export function buildPlayerStatistics(
  seasons: SeasonDetail[],
): PlayerStatsSummary[] {
  const playerMap: Record<
    string,
    PlayerStatsSummary & {
      placements: number[];
      gamePlacements: number[];
      teamNamesSet: Set<string>;
    }
  > = {};

  for (const season of seasons) {
    const teamPlayers = new Map<string, string[]>();
    for (const game of season.games) {
      for (const standing of game.standings) {
        teamPlayers.set(standing.teamId, standing.players);
      }
    }

    const teamDetail = Object.fromEntries(
      season.overallStandings.map((standing) => [standing.teamId, standing]),
    );
    const membershipMap: Record<string, string[]> = {};
    for (const team of season.games
      .flatMap((game) => game.standings)
      .map((standing) => ({
        teamId: standing.teamId,
        players: standing.players,
      }))) {
      membershipMap[team.teamId] = team.players;
    }

    for (const [teamId, standing] of Object.entries(teamDetail)) {
      const players = membershipMap[teamId] ?? [];
      for (const playerName of players) {
        const playerId = `${playerName}`;
        const summary = playerMap[playerId] || {
          playerId,
          playerName,
          seasons: 0,
          wonSeasons: 0,
          podiums: 0,
          averagePlacement: 0,
          bestPlacement: Number.MAX_SAFE_INTEGER,
          worstPlacement: 0,
          averageGamePlacement: 0,
          matchCount: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          totalPlacementPoints: 0,
          averagePlacementPoints: 0,
          teamNames: [],
          placements: [],
          gamePlacements: [],
          teamNamesSet: new Set<string>(),
        };

        summary.seasons += 1;
        if (standing.rank === 1 && season.isComplete) summary.wonSeasons += 1;
        if (standing.rank <= 3 && season.isComplete) summary.podiums += 1;
        summary.placements.push(standing.rank);
        summary.bestPlacement = Math.min(summary.bestPlacement, standing.rank);
        summary.worstPlacement = Math.max(
          summary.worstPlacement,
          standing.rank,
        );
        summary.totalPlacementPoints += standing.points;
        summary.teamNamesSet.add(standing.teamName);
        for (const game of season.games) {
          const gameStanding = game.standings.find(
            (entry) => entry.teamId === teamId,
          );
          if (gameStanding) {
            summary.gamePlacements.push(gameStanding.rank);
          }
        }
      }
    }
  }

  return Object.values(playerMap).map((summary) => {
    const seasonsCount = summary.seasons;
    const averagePlacement =
      seasonsCount > 0
        ? summary.placements.reduce((sum, value) => sum + value, 0) /
          seasonsCount
        : 0;
    const averageGamePlacement =
      summary.gamePlacements.length > 0
        ? summary.gamePlacements.reduce((sum, value) => sum + value, 0) /
          summary.gamePlacements.length
        : 0;
    return {
      playerId: summary.playerId,
      playerName: summary.playerName,
      seasons: seasonsCount,
      wonSeasons: summary.wonSeasons,
      podiums: summary.podiums,
      averagePlacement,
      bestPlacement:
        summary.bestPlacement === Number.MAX_SAFE_INTEGER
          ? 0
          : summary.bestPlacement,
      worstPlacement: summary.worstPlacement,
      averageGamePlacement,
      matchCount: summary.matchCount,
      wins: summary.wins,
      losses: summary.losses,
      winRate: 0,
      totalPlacementPoints: summary.totalPlacementPoints,
      averagePlacementPoints:
        seasonsCount > 0 ? summary.totalPlacementPoints / seasonsCount : 0,
      teamNames: Array.from(summary.teamNamesSet).sort(),
    };
  });
}

export async function progressTournament(tournamentId: string): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { matches: true },
  });
  if (!tournament || tournament.system !== "group_ko") return;

  const games = Array.from(
    new Set(tournament.matches.map((m) => m.gameId)),
  ) as string[];

  for (const gameId of games) {
    const byStage = (stage: string) =>
      tournament.matches.filter(
        (m) => m.gameId === gameId && m.stage === stage,
      );

    const groupMatches = byStage("group");
    if (groupMatches.length > 0 && groupMatches.every((m) => m.winnerId)) {
      const semiExists = byStage("semi_final").length > 0;
      if (!semiExists) {
        const groups: Record<string, string[]> = {};
        for (const m of groupMatches) {
          if (!m.groupName) continue;
          groups[m.groupName] = groups[m.groupName] || [];
          if (!groups[m.groupName].includes(m.team1Id))
            groups[m.groupName].push(m.team1Id);
          if (!groups[m.groupName].includes(m.team2Id))
            groups[m.groupName].push(m.team2Id);
        }
        const standings: Record<string, { teamId: string; points: number }[]> =
          {};
        for (const m of groupMatches) {
          const g = m.groupName as string;
          standings[g] =
            standings[g] || groups[g].map((t) => ({ teamId: t, points: 0 }));
          const entry = standings[g].find((s) => s.teamId === m.winnerId);
          if (entry) entry.points += 1;
        }
        for (const g of Object.keys(standings)) {
          standings[g].sort((a, b) => b.points - a.points);
        }
        await prisma.match.create({
          data: {
            tournamentId,
            gameId,
            team1Id: standings["A"][0].teamId,
            team2Id: standings["B"][1].teamId,
            stage: "semi_final",
          },
        });
        await prisma.match.create({
          data: {
            tournamentId,
            gameId,
            team1Id: standings["B"][0].teamId,
            team2Id: standings["A"][1].teamId,
            stage: "semi_final",
          },
        });
      }
    }

    const semis = byStage("semi_final");
    if (semis.length === 2 && semis.every((m) => m.winnerId)) {
      const finals = byStage("final");
      if (finals.length === 0) {
        const [s1, s2] = semis;
        await prisma.match.create({
          data: {
            tournamentId,
            gameId,
            team1Id: s1.winnerId as string,
            team2Id: s2.winnerId as string,
            stage: "final",
          },
        });
        await prisma.match.create({
          data: {
            tournamentId,
            gameId,
            team1Id: s1.team1Id === s1.winnerId ? s1.team2Id : s1.team1Id,
            team2Id: s2.team1Id === s2.winnerId ? s2.team2Id : s2.team1Id,
            stage: "third_place",
          },
        });
      }
    }
  }
}
