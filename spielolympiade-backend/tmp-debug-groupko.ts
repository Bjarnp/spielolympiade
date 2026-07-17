import { PrismaClient } from '@prisma/client';
import { normalizeMatch, buildGroupStandings, buildGroupKoStandings, computeTeamStats, buildTeamPlayers, buildTeamNames } from './src/utils/history-core';

const prisma = new PrismaClient();

(async () => {
  try {
    const season = await prisma.season.findFirst({
      where: { year: 2025 },
      include: {
        teams: { include: { members: { include: { user: true } } } },
        tournaments: {
          include: {
            matches: {
              include: { team1: true, team2: true, winner: true, game: true, results: true },
            },
          },
        },
      },
    });
    if (!season) {
      console.error('season not found');
      process.exit(1);
    }

    const teamPlayers = buildTeamPlayers(season.teams as any);
    const teamNames = buildTeamNames(season.teams as any);
    const matches = season.tournaments.flatMap((t) => t.matches.map((match) => normalizeMatch(match as any)));
    const groupMatches = matches.filter((match) => match.stage === 'group');
    const groupStandings = buildGroupStandings(groupMatches, teamPlayers, teamNames);
    console.log('groupStandings', JSON.stringify(groupStandings.map((group) => ({ groupName: group.groupName, standings: group.standings.map((s) => ({ teamId: s.teamId, teamName: s.teamName, rank: s.rank, points: s.points })) })), null, 2));
    const groupIds = Array.from(new Set(groupMatches.flatMap((match) => [match.team1Id, match.team2Id])));
    console.log('group team count', groupIds.length, groupIds.map((id) => teamNames[id] || id));
    const groupNames = Array.from(new Set(groupMatches.map((match) => match.groupName || 'A')));
    console.log('groupNames', groupNames);
    const groupCounts = Object.entries(groupMatches.reduce((acc, match) => {
      const name = match.groupName || 'A';
      acc[name] = acc[name] || { matchCount: 0, teamIds: new Set<string>() };
      acc[name].matchCount += 1;
      acc[name].teamIds.add(match.team1Id);
      acc[name].teamIds.add(match.team2Id);
      return acc;
    }, {} as Record<string, { matchCount: number; teamIds: Set<string> }>)).map(([name, entry]) => ({ groupName: name, matchCount: entry.matchCount, teamCount: entry.teamIds.size, teams: Array.from(entry.teamIds).map((id) => teamNames[id] || id) }));
    console.log('groupCounts', JSON.stringify(groupCounts, null, 2));
    const finalMatches = matches.filter((match) => match.stage === 'final');
    console.log('finalMatches', finalMatches.map((match) => ({ id: match.id, team1Name: teamNames[match.team1Id], team2Name: teamNames[match.team2Id], winnerName: match.winnerId ? teamNames[match.winnerId] : null })));
    const thirdMatches = matches.filter((match) => match.stage === 'third_place');
    console.log('thirdMatches', thirdMatches.map((match) => ({ id: match.id, team1Name: teamNames[match.team1Id], team2Name: teamNames[match.team2Id], winnerName: match.winnerId ? teamNames[match.winnerId] : null })));
    const semis = matches.filter((match) => match.stage === 'semi_final');
    console.log('semi_final count', semis.length, semis.map((match) => ({ id: match.id, team1Name: teamNames[match.team1Id], team2Name: teamNames[match.team2Id], winnerName: match.winnerId ? teamNames[match.winnerId] : null })));
    const koSummary = buildGroupKoStandings(matches, teamPlayers, teamNames);
    console.log('ko standings', JSON.stringify(koSummary.standings.map((s) => ({ teamId: s.teamId, teamName: s.teamName, rank: s.rank, points: s.points })), null, 2));
    console.log('ko isComplete', koSummary.isComplete);
    const { stats } = computeTeamStats(matches, teamPlayers, teamNames);
    console.log('computeTeamStats count', stats.length);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();
