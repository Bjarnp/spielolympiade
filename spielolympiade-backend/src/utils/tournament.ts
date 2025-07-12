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

export function calculateGroupKoStandings(matches: Match[]): {
  teamId: string;
  wins: number;
  losses: number;
  ratio: number;
  rank: number;
  points: number;
}[] {
  const stats: Record<string, { wins: number; losses: number }> = {};

  // zunächst Siege/Niederlagen der Gruppenphase erfassen
  for (const m of matches.filter((x) => x.stage === "group")) {
    stats[m.team1Id] = stats[m.team1Id] || { wins: 0, losses: 0 };
    stats[m.team2Id] = stats[m.team2Id] || { wins: 0, losses: 0 };
    if (m.winnerId) {
      const loser = m.team1Id === m.winnerId ? m.team2Id : m.team1Id;
      stats[m.winnerId].wins += 1;
      stats[loser].losses += 1;
    }
  }

  // sicherstellen, dass Teams ohne Gruppensieg auch im Stats-Objekt sind
  for (const m of matches) {
    stats[m.team1Id] = stats[m.team1Id] || { wins: 0, losses: 0 };
    stats[m.team2Id] = stats[m.team2Id] || { wins: 0, losses: 0 };
  }

  const table = Object.entries(stats).map(([teamId, s]) => ({
    teamId,
    wins: s.wins,
    losses: s.losses,
    ratio: s.wins + s.losses > 0 ? s.wins / (s.wins + s.losses) : 0,
  }));

  // Platz 1-4 werden über die KO-Phase bestimmt
  const final = matches.find((m) => m.stage === "final" && m.winnerId);
  const third = matches.find((m) => m.stage === "third_place" && m.winnerId);

  let ranking: string[] = [];
  if (final && third) {
    const finalLoser = final.team1Id === final.winnerId ? final.team2Id : final.team1Id;
    const thirdLoser = third.team1Id === third.winnerId ? third.team2Id : third.team1Id;
    ranking = [final.winnerId, finalLoser, third.winnerId, thirdLoser];
  }

  const ordered = ranking
    .map((id) => table.find((t) => t.teamId === id)!)
    .filter(Boolean)
    .concat(
      table
        .filter((t) => !ranking.includes(t.teamId))
        .sort((a, b) => {
          if (b.ratio !== a.ratio) return b.ratio - a.ratio;
          return Math.random() - 0.5; // Zufall bei Gleichstand
        })
    );

  const totalTeams = ordered.length;

  return ordered.map((e, idx) => ({
    ...e,
    rank: idx + 1,
    points: totalTeams - (idx + 1),
  }));
}

