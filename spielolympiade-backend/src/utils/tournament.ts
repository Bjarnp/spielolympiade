import { PrismaClient, Match } from "@prisma/client";

const prisma = new PrismaClient();

export async function progressTournament(tournamentId: string): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { matches: true },
  });
  if (!tournament || tournament.system !== "group_ko") return;

  const games = Array.from(
    new Set(tournament.matches.map((m) => m.gameId))
  ) as string[];

  for (const gameId of games) {
    const byStage = (stage: string) =>
      tournament.matches.filter(
        (m) => m.gameId === gameId && m.stage === stage
      );

    const groupMatches = byStage("group");
    if (
      groupMatches.length > 0 &&
      groupMatches.every((m) => m.winnerId)
    ) {
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
        const standings: Record<string, { teamId: string; points: number }[]> = {};
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
