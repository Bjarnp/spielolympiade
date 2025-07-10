import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();

function hash(pw: string): string {
  return createHash("sha256").update(pw).digest("hex");
}

async function main() {
  const pw = await bcrypt.hash("test", 10);
  const season = await prisma.season.create({
    data: {
      id: "season-2024",
      year: 2024,
      name: "Saison 2024",
      isActive: false,
      finishedAt: new Date("2024-08-01"),
    },
  });

  const tournament = await prisma.tournament.create({
    data: {
      id: "tournament-2024",
      seasonId: season.id,
      system: "round_robin",
    },
  });

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: "8ouu6z9z1",
        name: "Luca",
        username: "luca",
        passwordHash: hash("luca"),
        role: "player",
      },
    }),
    prisma.user.create({
      data: {
        id: "idl0k1rw5",
        name: "Seb",
        username: "seb",
        passwordHash: hash("seb"),
        role: "player",
      },
    }),
    prisma.user.create({
      data: {
        id: "4z4bch1dt",
        name: "BJ",
        username: "bj",
        passwordHash: hash("bj"),
        role: "admin",
      },
    }),
    prisma.user.create({
      data: {
        id: "7oxoq18uz",
        name: "Jens",
        username: "jens",
        passwordHash: hash("jens"),
        role: "player",
      },
    }),
    prisma.user.create({
      data: {
        id: "xl3jdapud",
        name: "Oskar",
        username: "oskar",
        passwordHash: hash("oskar"),
        role: "player",
      },
    }),
    prisma.user.create({
      data: {
        id: "9uvjuud71",
        name: "Leo",
        username: "leo",
        passwordHash: hash("leo"),
        role: "player",
      },
    }),
    prisma.user.create({
      data: {
        id: "l8z0fjukn",
        name: "Noah",
        username: "noah",
        passwordHash: hash("noah"),
        role: "player",
      },
    }),
    prisma.user.create({
      data: {
        id: "mxrty0x6m",
        name: "Julian",
        username: "julian",
        passwordHash: hash("julian"),
        role: "player",
      },
    }),
    prisma.user.create({
      data: {
        id: "93hmsiv8b",
        name: "Louis",
        username: "louis",
        passwordHash: hash("louis"),
        role: "player",
      },
    }),
    prisma.user.create({
      data: {
        id: "vws3r4h7i",
        name: "Andi",
        username: "andi",
        passwordHash: hash("andi"),
        role: "player",
      },
    }),
    prisma.user.create({
      data: {
        id: "dhcmob6mz",
        name: "Pati",
        username: "pati",
        passwordHash: hash("pati"),
        role: "player",
      },
    }),
  ]);

  await prisma.$transaction([
    prisma.game.create({
      data: { id: "p22vc24m2", name: `Bierpong`, rules: `6 Becher` },
    }),
    prisma.game.create({
      data: { id: "goip3j584", name: `Flunkyball`, rules: `1 Bier pro Person` },
    }),
    prisma.game.create({
      data: {
        id: "k3d37w0zi",
        name: `Kastenrennen`,
        rules: `1 Bier pro Person`,
      },
    }),
    prisma.game.create({
      data: {
        id: "2wib896t3",
        name: `BIG Pong`,
        rules: `Bierpong auf dem Rasen`,
      },
    }),
  ]);

  await prisma.team.create({
    data: {
      id: "arrdmzk9r",
      name: `Der Schöne und das Biest`,
      seasonId: season.id,
      members: {
        create: [{ userId: "l8z0fjukn" }, { userId: "8ouu6z9z1" }],
      },
    },
  });
  await prisma.team.create({
    data: {
      id: "gzadppcvy",
      name: `Paderborner Indervernascher`,
      seasonId: season.id,
      members: {
        create: [{ userId: "7oxoq18uz" }, { userId: "mxrty0x6m" }],
      },
    },
  });
  await prisma.team.create({
    data: {
      id: "qbrpr5ahe",
      name: `Bandi`,
      seasonId: season.id,
      members: {
        create: [{ userId: "4z4bch1dt" }, { userId: "vws3r4h7i" }],
      },
    },
  });
  await prisma.team.create({
    data: {
      id: "4vlubnxkp",
      name: `Two Girls One Cup`,
      seasonId: season.id,
      members: {
        create: [{ userId: "xl3jdapud" }, { userId: "93hmsiv8b" }],
      },
    },
  });
  await prisma.team.create({
    data: {
      id: "q8kink268",
      name: `Biervernichter`,
      seasonId: season.id,
      members: {
        create: [{ userId: "idl0k1rw5" }, { userId: "dhcmob6mz" }],
      },
    },
  });

  await prisma.match.create({
    data: {
      id: "s6x3ckng6",
      gameId: "p22vc24m2",
      tournamentId: tournament.id,
      team1Id: "q8kink268",
      team2Id: "4vlubnxkp",
      winnerId: `q8kink268`,
      results: {
        create: [
          { teamId: "q8kink268", score: 1 },
          { teamId: "4vlubnxkp", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "zg2a4ktsc",
      gameId: "goip3j584",
      tournamentId: tournament.id,
      team1Id: "gzadppcvy",
      team2Id: "qbrpr5ahe",
      winnerId: `gzadppcvy`,
      results: {
        create: [
          { teamId: "gzadppcvy", score: 1 },
          { teamId: "qbrpr5ahe", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "ucau0wo62",
      gameId: "p22vc24m2",
      tournamentId: tournament.id,
      team1Id: "arrdmzk9r",
      team2Id: "4vlubnxkp",
      winnerId: `arrdmzk9r`,
      results: {
        create: [
          { teamId: "arrdmzk9r", score: 1 },
          { teamId: "4vlubnxkp", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "36q85e93j",
      gameId: "2wib896t3",
      tournamentId: tournament.id,
      team1Id: "qbrpr5ahe",
      team2Id: "q8kink268",
      winnerId: `qbrpr5ahe`,
      results: {
        create: [
          { teamId: "qbrpr5ahe", score: 1 },
          { teamId: "q8kink268", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "feg66tav2",
      gameId: "2wib896t3",
      tournamentId: tournament.id,
      team1Id: "q8kink268",
      team2Id: "arrdmzk9r",
      winnerId: `q8kink268`,
      results: {
        create: [
          { teamId: "q8kink268", score: 1 },
          { teamId: "arrdmzk9r", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "zp8dke8v9",
      gameId: "p22vc24m2",
      tournamentId: tournament.id,
      team1Id: "gzadppcvy",
      team2Id: "4vlubnxkp",
      winnerId: `4vlubnxkp`,
      results: {
        create: [
          { teamId: "gzadppcvy", score: 0 },
          { teamId: "4vlubnxkp", score: 1 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "uflgbitps",
      gameId: "goip3j584",
      tournamentId: tournament.id,
      team1Id: "arrdmzk9r",
      team2Id: "qbrpr5ahe",
      winnerId: `arrdmzk9r`,
      results: {
        create: [
          { teamId: "arrdmzk9r", score: 1 },
          { teamId: "qbrpr5ahe", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "zf1lxxw3v",
      gameId: "2wib896t3",
      tournamentId: tournament.id,
      team1Id: "qbrpr5ahe",
      team2Id: "4vlubnxkp",
      winnerId: `4vlubnxkp`,
      results: {
        create: [
          { teamId: "qbrpr5ahe", score: 0 },
          { teamId: "4vlubnxkp", score: 1 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "0a6vx8j5t",
      gameId: "p22vc24m2",
      tournamentId: tournament.id,
      team1Id: "q8kink268",
      team2Id: "gzadppcvy",
      winnerId: `q8kink268`,
      results: {
        create: [
          { teamId: "q8kink268", score: 1 },
          { teamId: "gzadppcvy", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "wen6xwj68",
      gameId: "p22vc24m2",
      tournamentId: tournament.id,
      team1Id: "qbrpr5ahe",
      team2Id: "arrdmzk9r",
      winnerId: `qbrpr5ahe`,
      results: {
        create: [
          { teamId: "qbrpr5ahe", score: 1 },
          { teamId: "arrdmzk9r", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "u2c9r6l4u",
      gameId: "2wib896t3",
      tournamentId: tournament.id,
      team1Id: "gzadppcvy",
      team2Id: "4vlubnxkp",
      winnerId: `gzadppcvy`,
      results: {
        create: [
          { teamId: "gzadppcvy", score: 1 },
          { teamId: "4vlubnxkp", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "j37oul8q4",
      gameId: "k3d37w0zi",
      tournamentId: tournament.id,
      team1Id: "gzadppcvy",
      team2Id: "qbrpr5ahe",
      winnerId: `gzadppcvy`,
      results: {
        create: [
          { teamId: "gzadppcvy", score: 1 },
          { teamId: "qbrpr5ahe", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "irg3hkv2m",
      gameId: "p22vc24m2",
      tournamentId: tournament.id,
      team1Id: "q8kink268",
      team2Id: "arrdmzk9r",
      winnerId: `q8kink268`,
      results: {
        create: [
          { teamId: "q8kink268", score: 1 },
          { teamId: "arrdmzk9r", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "ad63a2zte",
      gameId: "goip3j584",
      tournamentId: tournament.id,
      team1Id: "qbrpr5ahe",
      team2Id: "4vlubnxkp",
      winnerId: `qbrpr5ahe`,
      results: {
        create: [
          { teamId: "qbrpr5ahe", score: 1 },
          { teamId: "4vlubnxkp", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "7ed69enq9",
      gameId: "goip3j584",
      tournamentId: tournament.id,
      team1Id: "4vlubnxkp",
      team2Id: "q8kink268",
      winnerId: `4vlubnxkp`,
      results: {
        create: [
          { teamId: "4vlubnxkp", score: 1 },
          { teamId: "q8kink268", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "z7kb2zmdw",
      gameId: "p22vc24m2",
      tournamentId: tournament.id,
      team1Id: "gzadppcvy",
      team2Id: "arrdmzk9r",
      winnerId: `gzadppcvy`,
      results: {
        create: [
          { teamId: "gzadppcvy", score: 1 },
          { teamId: "arrdmzk9r", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "3fu6rilxo",
      gameId: "k3d37w0zi",
      tournamentId: tournament.id,
      team1Id: "gzadppcvy",
      team2Id: "arrdmzk9r",
      winnerId: `gzadppcvy`,
      results: {
        create: [
          { teamId: "gzadppcvy", score: 1 },
          { teamId: "arrdmzk9r", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "3v1x689r2",
      gameId: "p22vc24m2",
      tournamentId: tournament.id,
      team1Id: "q8kink268",
      team2Id: "qbrpr5ahe",
      winnerId: `q8kink268`,
      results: {
        create: [
          { teamId: "q8kink268", score: 1 },
          { teamId: "qbrpr5ahe", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "chzhsjzas",
      gameId: "goip3j584",
      tournamentId: tournament.id,
      team1Id: "arrdmzk9r",
      team2Id: "gzadppcvy",
      winnerId: `arrdmzk9r`,
      results: {
        create: [
          { teamId: "arrdmzk9r", score: 1 },
          { teamId: "gzadppcvy", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "k0jktj4ou",
      gameId: "2wib896t3",
      tournamentId: tournament.id,
      team1Id: "arrdmzk9r",
      team2Id: "4vlubnxkp",
      winnerId: `arrdmzk9r`,
      results: {
        create: [
          { teamId: "arrdmzk9r", score: 1 },
          { teamId: "4vlubnxkp", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "qa1hjzauw",
      gameId: "k3d37w0zi",
      tournamentId: tournament.id,
      team1Id: "4vlubnxkp",
      team2Id: "q8kink268",
      winnerId: `4vlubnxkp`,
      results: {
        create: [
          { teamId: "4vlubnxkp", score: 1 },
          { teamId: "q8kink268", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "uaw8m2h2f",
      gameId: "p22vc24m2",
      tournamentId: tournament.id,
      team1Id: "qbrpr5ahe",
      team2Id: "gzadppcvy",
      winnerId: `qbrpr5ahe`,
      results: {
        create: [
          { teamId: "qbrpr5ahe", score: 1 },
          { teamId: "gzadppcvy", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "qy4nl4ljz",
      gameId: "k3d37w0zi",
      tournamentId: tournament.id,
      team1Id: "gzadppcvy",
      team2Id: "q8kink268",
      winnerId: `gzadppcvy`,
      results: {
        create: [
          { teamId: "gzadppcvy", score: 1 },
          { teamId: "q8kink268", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "j8if9vdrd",
      gameId: "k3d37w0zi",
      tournamentId: tournament.id,
      team1Id: "qbrpr5ahe",
      team2Id: "q8kink268",
      winnerId: `qbrpr5ahe`,
      results: {
        create: [
          { teamId: "qbrpr5ahe", score: 1 },
          { teamId: "q8kink268", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "i2sl08x4v",
      gameId: "goip3j584",
      tournamentId: tournament.id,
      team1Id: "4vlubnxkp",
      team2Id: "gzadppcvy",
      winnerId: `4vlubnxkp`,
      results: {
        create: [
          { teamId: "4vlubnxkp", score: 1 },
          { teamId: "gzadppcvy", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "ns8ob2btj",
      gameId: "2wib896t3",
      tournamentId: tournament.id,
      team1Id: "qbrpr5ahe",
      team2Id: "arrdmzk9r",
      winnerId: `qbrpr5ahe`,
      results: {
        create: [
          { teamId: "qbrpr5ahe", score: 1 },
          { teamId: "arrdmzk9r", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "8ryd9lzg3",
      gameId: "2wib896t3",
      tournamentId: tournament.id,
      team1Id: "q8kink268",
      team2Id: "4vlubnxkp",
      winnerId: `q8kink268`,
      results: {
        create: [
          { teamId: "q8kink268", score: 1 },
          { teamId: "4vlubnxkp", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "9ivki9d4v",
      gameId: "k3d37w0zi",
      tournamentId: tournament.id,
      team1Id: "qbrpr5ahe",
      team2Id: "arrdmzk9r",
      winnerId: `qbrpr5ahe`,
      results: {
        create: [
          { teamId: "qbrpr5ahe", score: 1 },
          { teamId: "arrdmzk9r", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "8342udo1g",
      gameId: "k3d37w0zi",
      tournamentId: tournament.id,
      team1Id: "qbrpr5ahe",
      team2Id: "4vlubnxkp",
      winnerId: `qbrpr5ahe`,
      results: {
        create: [
          { teamId: "qbrpr5ahe", score: 1 },
          { teamId: "4vlubnxkp", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "wqxht9ly3",
      gameId: "goip3j584",
      tournamentId: tournament.id,
      team1Id: "arrdmzk9r",
      team2Id: "q8kink268",
      winnerId: `arrdmzk9r`,
      results: {
        create: [
          { teamId: "arrdmzk9r", score: 1 },
          { teamId: "q8kink268", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "ksvk3tnvr",
      gameId: "goip3j584",
      tournamentId: tournament.id,
      team1Id: "arrdmzk9r",
      team2Id: "4vlubnxkp",
      winnerId: `arrdmzk9r`,
      results: {
        create: [
          { teamId: "arrdmzk9r", score: 1 },
          { teamId: "4vlubnxkp", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "is8dgtny8",
      gameId: "2wib896t3",
      tournamentId: tournament.id,
      team1Id: "qbrpr5ahe",
      team2Id: "gzadppcvy",
      winnerId: `qbrpr5ahe`,
      results: {
        create: [
          { teamId: "qbrpr5ahe", score: 1 },
          { teamId: "gzadppcvy", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "i14mkeu14",
      gameId: "2wib896t3",
      tournamentId: tournament.id,
      team1Id: "gzadppcvy",
      team2Id: "q8kink268",
      winnerId: `q8kink268`,
      results: {
        create: [
          { teamId: "gzadppcvy", score: 0 },
          { teamId: "q8kink268", score: 1 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "zrsqeokd8",
      gameId: "p22vc24m2",
      tournamentId: tournament.id,
      team1Id: "qbrpr5ahe",
      team2Id: "4vlubnxkp",
      winnerId: `qbrpr5ahe`,
      results: {
        create: [
          { teamId: "qbrpr5ahe", score: 1 },
          { teamId: "4vlubnxkp", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "6dcxju22h",
      gameId: "goip3j584",
      tournamentId: tournament.id,
      team1Id: "gzadppcvy",
      team2Id: "q8kink268",
      winnerId: `gzadppcvy`,
      results: {
        create: [
          { teamId: "gzadppcvy", score: 1 },
          { teamId: "q8kink268", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "g6hlsws97",
      gameId: "goip3j584",
      tournamentId: tournament.id,
      team1Id: "qbrpr5ahe",
      team2Id: "q8kink268",
      winnerId: `qbrpr5ahe`,
      results: {
        create: [
          { teamId: "qbrpr5ahe", score: 1 },
          { teamId: "q8kink268", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "3ewouh13s",
      gameId: "k3d37w0zi",
      tournamentId: tournament.id,
      team1Id: "arrdmzk9r",
      team2Id: "4vlubnxkp",
      winnerId: `arrdmzk9r`,
      results: {
        create: [
          { teamId: "arrdmzk9r", score: 1 },
          { teamId: "4vlubnxkp", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "1gh8hknnv",
      gameId: "k3d37w0zi",
      tournamentId: tournament.id,
      team1Id: "q8kink268",
      team2Id: "arrdmzk9r",
      winnerId: `q8kink268`,
      results: {
        create: [
          { teamId: "q8kink268", score: 1 },
          { teamId: "arrdmzk9r", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "zhszno968",
      gameId: "2wib896t3",
      tournamentId: tournament.id,
      team1Id: "gzadppcvy",
      team2Id: "arrdmzk9r",
      winnerId: `gzadppcvy`,
      results: {
        create: [
          { teamId: "gzadppcvy", score: 1 },
          { teamId: "arrdmzk9r", score: 0 },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: "00j8xps0o",
      gameId: "k3d37w0zi",
      tournamentId: tournament.id,
      team1Id: "gzadppcvy",
      team2Id: "4vlubnxkp",
      winnerId: `gzadppcvy`,
      results: {
        create: [
          { teamId: "gzadppcvy", score: 1 },
          { teamId: "4vlubnxkp", score: 0 },
        ],
      },
    },
  });

  console.log("✅ Seed erfolgreich abgeschlossen.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
