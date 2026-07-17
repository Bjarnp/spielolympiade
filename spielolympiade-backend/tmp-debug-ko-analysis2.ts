import { PrismaClient } from "@prisma/client";
import {
  normalizeMatch,
  buildGroupKoStandings,
} from "./src/utils/history-core";

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
              include: {
                team1: true,
                team2: true,
                winner: true,
                game: true,
                results: true,
              },
            },
          },
        },
      },
    });
    if (!season) {
      console.error("season not found");
      return;
    }

    const teamPlayers = Object.fromEntries(
      season.teams.map((team: any) => [
        team.id,
        team.members.map((member: any) => member.user.name),
      ]),
    );
    const teamNames = Object.fromEntries(
      season.teams.map((team: any) => [team.id, team.name]),
    );
    const matches = season.tournaments.flatMap((tournament: any) =>
      tournament.matches.map((match: any) => normalizeMatch(match)),
    );

    const allTeamIds = Array.from(
      new Set(matches.flatMap((match) => [match.team1Id, match.team2Id])),
    );
    console.log("allTeamIds count", allTeamIds.length);
    console.log(
      "allTeamIds",
      allTeamIds.map((id) => `${id}:${teamNames[id] || id}`),
    );

    const stageSummary = matches.reduce(
      (acc: any, match) => {
        const stage = match.stage || "null";
        if (!acc[stage])
          acc[stage] = {
            count: 0,
            teamIds: new Set<string>(),
            pairKeys: new Map<string, number>(),
          };
        const entry = acc[stage];
        entry.count += 1;
        entry.teamIds.add(match.team1Id);
        entry.teamIds.add(match.team2Id);
        const key = [match.team1Id, match.team2Id].sort().join("|");
        entry.pairKeys.set(key, (entry.pairKeys.get(key) || 0) + 1);
        return acc;
      },
      {} as Record<
        string,
        { count: number; teamIds: Set<string>; pairKeys: Map<string, number> }
      >,
    );

    console.log(
      "stageSummary",
      JSON.stringify(
        Object.entries(stageSummary).map(([stage, summary]) => ({
          stage,
          count: summary.count,
          teamCount: summary.teamIds.size,
          pairs: Array.from(summary.pairKeys.entries()),
        })),
        null,
        2,
      ),
    );

    const finals = matches.filter((match) => match.stage === "final");
    const thirds = matches.filter((match) => match.stage === "third_place");
    console.log(
      "finals",
      finals.length,
      finals.map((m) => ({
        id: m.id,
        teams: [m.team1Id, m.team2Id].map((id) => teamNames[id]),
        winner: m.winnerId ? teamNames[m.winnerId] : null,
      })),
    );
    console.log(
      "thirds",
      thirds.length,
      thirds.map((m) => ({
        id: m.id,
        teams: [m.team1Id, m.team2Id].map((id) => teamNames[id]),
        winner: m.winnerId ? teamNames[m.winnerId] : null,
      })),
    );

    const summary = buildGroupKoStandings(matches, teamPlayers, teamNames);
    console.log("summary isComplete", summary.isComplete);
    console.log("summary standings count", summary.standings.length);
    console.log(
      "duplicate counts",
      JSON.stringify(
        summary.standings.reduce((acc: any, s) => {
          acc[s.teamId] = (acc[s.teamId] || 0) + 1;
          return acc;
        }, {}),
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify(
        summary.standings.map((s) => ({
          teamId: s.teamId,
          teamName: s.teamName,
          rank: s.rank,
          points: s.points,
          isCertain: s.isCertain,
        })),
        null,
        2,
      ),
    );

    const rankedTeamIds = new Set(summary.standings.map((s) => s.teamId));
    const duplicates = summary.standings.filter(
      (s, index) =>
        summary.standings.findIndex((other) => other.teamId === s.teamId) !==
        index,
    );
    console.log(
      "duplicate entries by index",
      JSON.stringify(duplicates, null, 2),
    );
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();
