const { PrismaClient } = require("@prisma/client");
const {
  normalizeMatch,
  buildGroupKoStandings,
} = require("./src/utils/history-core.js");
(async () => {
  const prisma = new PrismaClient();
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
    if (!season) return console.error("not found");
    const teamNames = Object.fromEntries(
      season.teams.map((t) => [t.id, t.name]),
    );
    const matches = season.tournaments.flatMap((t) =>
      t.matches.map((m) => normalizeMatch(m)),
    );

    const finals = matches.filter((m) => m.stage === "final");
    console.log("finals count", finals.length);
    finals.forEach((m, idx) => {
      console.log(
        "final",
        idx,
        m.id,
        m.team1Name,
        m.team2Name,
        "winner",
        m.winnerName,
        "playedAt",
        m.playedAt,
        "group",
        m.groupName,
      );
    });
    const thirds = matches.filter((m) => m.stage === "third_place");
    console.log("third_place count", thirds.length);
    thirds.forEach((m, idx) => {
      console.log(
        "third",
        idx,
        m.id,
        m.team1Name,
        m.team2Name,
        "winner",
        m.winnerName,
        "playedAt",
        m.playedAt,
        "group",
        m.groupName,
      );
    });
    const semis = matches.filter((m) => m.stage === "semi_final");
    console.log("semi count", semis.length);
    semis.forEach((m, idx) => {
      console.log(
        "semi",
        idx,
        m.team1Name,
        m.team2Name,
        "winner",
        m.winnerName,
        "group",
        m.groupName,
      );
    });
    const matchByPair = finals.concat(thirds).reduce((acc, m) => {
      const key = [m.team1Id, m.team2Id].sort().join("|");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    console.log("pair counts", matchByPair);

    const summary = buildGroupKoStandings(
      matches,
      Object.fromEntries(
        season.teams.map((t) => [t.id, t.members.map((m) => m.user.name)]),
      ),
      teamNames,
    );
    console.log("summary standings length", summary.standings.length);
    console.log(
      "summary duplicates",
      summary.standings.reduce((acc, s) => {
        acc[s.teamId] = (acc[s.teamId] || 0) + 1;
        return acc;
      }, {}),
    );
    summary.standings.forEach((s) => console.log(s.teamName, s.rank, s.points));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();
