import { PrismaClient } from "@prisma/client";
import { buildSeasonDetail } from "./src/utils/history-core";

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
                game: true,
                results: true,
                winner: true,
                team1: true,
                team2: true,
              },
            },
          },
        },
      },
    });
    if (!season) {
      console.error("season not found");
      process.exit(1);
    }
    const detail = buildSeasonDetail(season as any);
    console.log(
      "season tournaments:",
      JSON.stringify(
        season.tournaments.map((t) => ({
          id: t.id,
          system: t.system,
          location: t.location,
          matchCount: t.matches.length,
        })),
        null,
        2,
      ),
    );
    console.log(
      "game summaries:",
      JSON.stringify(
        detail.games.map((g) => ({
          gameId: g.gameId,
          gameName: g.gameName,
          system: g.system,
          location: g.location,
          matchCount: g.matchCount,
          teamCount: g.standings.length,
          standings: g.standings.map((s) => ({
            teamId: s.teamId,
            team: s.teamName,
            rank: s.rank,
            points: s.points,
          })),
        })),
        null,
        2,
      ),
    );
    const seasonMatches = season.tournaments.flatMap((t) => t.matches);
    const finalMatches = seasonMatches.filter((m) => m.stage === "final");
    const thirdMatches = seasonMatches.filter((m) => m.stage === "third_place");
    console.log(
      "knockout stage summary:",
      JSON.stringify(
        Array.from(
          new Map(
            seasonMatches
              .filter((m) => m.stage !== "group")
              .map((m) => [
                m.stage + "|" + (m.playedAt || ""),
                { stage: m.stage, count: 1 },
              ]),
          ).values(),
        ),
        null,
        2,
      ),
    );
    const stageGroups = seasonMatches
      .filter((m) => m.stage !== "group")
      .reduce(
        (acc, m) => {
          const key = m.stage || "unknown";
          acc[key] = acc[key] || [];
          acc[key].push({
            id: m.id,
            groupName: m.groupName,
            team1Id: m.team1Id,
            team2Id: m.team2Id,
            team1Name:
              season.teams.find((t) => t.id === m.team1Id)?.name || m.team1Id,
            team2Name:
              season.teams.find((t) => t.id === m.team2Id)?.name || m.team2Id,
            winnerId: m.winnerId,
            winnerName:
              season.teams.find((t) => t.id === m.winnerId)?.name || m.winnerId,
            playedAt: m.playedAt,
          });
          return acc;
        },
        {} as Record<string, any[]>,
      );
    console.log(
      "knockout matches by stage:",
      JSON.stringify(stageGroups, null, 2),
    );
    const stageCounts = seasonMatches.reduce(
      (acc, m) => {
        const key = m.stage || "unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    console.log("stage counts:", JSON.stringify(stageCounts, null, 2));
    const ranks = seasonMatches.reduce(
      (acc, m) => {
        if (m.winnerId) acc[m.winnerId] = (acc[m.winnerId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    console.log("win counts by team:", JSON.stringify(ranks, null, 2));
    console.log(
      JSON.stringify(
        detail.overallStandings.map((s) => ({
          team: s.teamName,
          rank: s.rank,
          points: s.points,
          wins: s.wins,
          losses: s.losses,
          games: s.games,
        })),
        null,
        2,
      ),
    );
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();
