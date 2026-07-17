import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  try {
    const season = await prisma.season.findFirst({
      where: { year: 2025 },
      include: {
        teams: true,
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

    const matches = season.tournaments.flatMap((t) => t.matches);
    const byStage: Record<string, typeof matches> = {};
    for (const match of matches) {
      const stage = match.stage ?? 'null';
      byStage[stage] = byStage[stage] || [];
      byStage[stage].push(match);
    }

    console.log('stageCounts', Object.fromEntries(Object.entries(byStage).map(([stage, list]) => [stage, list.length])));

    for (const stage of ['group', 'semi_final', 'third_place', 'final']) {
      const group = byStage[stage] || [];
      if (!group.length) continue;
      console.log(`\n=== ${stage} (${group.length}) ===`);
      const teamIds = Array.from(new Set(group.flatMap((m) => [m.team1Id, m.team2Id])));
      console.log('unique team ids', teamIds.length, teamIds);

      const pairKeys = group.map((m) => [m.team1Id, m.team2Id].sort().join('|'));
      const uniquePairs = Array.from(new Set(pairKeys));
      console.log('uniquePairs', uniquePairs.length);

      const teamMatchCount = teamIds.map((teamId) => ({
        teamId,
        count: group.filter((m) => m.team1Id === teamId || m.team2Id === teamId).length,
      })).sort((a, b) => b.count - a.count || a.teamId.localeCompare(b.teamId));
      console.log('teamMatchCount', teamMatchCount);

      const winners = group.map((m) => m.winnerId).filter((id): id is string => !!id);
      console.log('winner ids unique', Array.from(new Set(winners)));
      console.log('winners by count', Array.from(new Set(winners)).map((id) => ({ id, count: winners.filter((w) => w === id).length })));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();
