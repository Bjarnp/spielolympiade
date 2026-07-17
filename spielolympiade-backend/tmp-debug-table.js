"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const history_core_1 = require("./src/utils/history-core");
const prisma = new client_1.PrismaClient();
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const season = yield prisma.season.findFirst({
            where: { year: 2025 },
            include: {
                teams: { include: { members: { include: { user: true } } } },
                tournaments: {
                    include: {
                        matches: {
                            include: { game: true, results: true, winner: true, team1: true, team2: true },
                        },
                    },
                },
            },
        });
        if (!season) {
            console.error('season not found');
            process.exit(1);
        }
        const detail = (0, history_core_1.buildSeasonDetail)(season);
        console.log('season tournaments:', JSON.stringify(season.tournaments.map((t) => ({ id: t.id, system: t.system, location: t.location, matchCount: t.matches.length })), null, 2));
        console.log('game summaries:', JSON.stringify(detail.games.map((g) => ({
            gameId: g.gameId,
            gameName: g.gameName,
            system: g.system,
            location: g.location,
            matchCount: g.matchCount,
            teamCount: g.standings.length,
            standings: g.standings.map((s) => ({ teamId: s.teamId, team: s.teamName, rank: s.rank, points: s.points }))
        })), null, 2));
        const seasonMatches = season.tournaments.flatMap((t) => t.matches);
        const finalMatches = seasonMatches.filter((m) => m.stage === 'final');
        const thirdMatches = seasonMatches.filter((m) => m.stage === 'third_place');
        console.log('knockout stage summary:', JSON.stringify(Array.from(new Map(seasonMatches.filter((m) => m.stage !== 'group').map((m) => [m.stage + '|' + (m.playedAt || ''), { stage: m.stage, count: 1 }])).values()), null, 2));
        const stageGroups = seasonMatches.filter((m) => m.stage !== 'group').reduce((acc, m) => {
            var _a, _b, _c;
            const key = m.stage || 'unknown';
            acc[key] = acc[key] || [];
            acc[key].push({
                id: m.id,
                groupName: m.groupName,
                team1Id: m.team1Id,
                team2Id: m.team2Id,
                team1Name: ((_a = season.teams.find((t) => t.id === m.team1Id)) === null || _a === void 0 ? void 0 : _a.name) || m.team1Id,
                team2Name: ((_b = season.teams.find((t) => t.id === m.team2Id)) === null || _b === void 0 ? void 0 : _b.name) || m.team2Id,
                winnerId: m.winnerId,
                winnerName: ((_c = season.teams.find((t) => t.id === m.winnerId)) === null || _c === void 0 ? void 0 : _c.name) || m.winnerId,
                playedAt: m.playedAt,
            });
            return acc;
        }, {});
        console.log('knockout matches by stage:', JSON.stringify(stageGroups, null, 2));
        const stageCounts = seasonMatches.reduce((acc, m) => {
            const key = m.stage || 'unknown';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        console.log('stage counts:', JSON.stringify(stageCounts, null, 2));
        const ranks = seasonMatches.reduce((acc, m) => {
            if (m.winnerId)
                acc[m.winnerId] = (acc[m.winnerId] || 0) + 1;
            return acc;
        }, {});
        console.log('win counts by team:', JSON.stringify(ranks, null, 2));
        console.log(JSON.stringify(detail.overallStandings.map((s) => ({
            team: s.teamName,
            rank: s.rank,
            points: s.points,
            wins: s.wins,
            losses: s.losses,
            games: s.games,
        })), null, 2));
    }
    catch (err) {
        console.error(err);
    }
    finally {
        yield prisma.$disconnect();
    }
}))();
