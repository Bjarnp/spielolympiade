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
                        matches: { include: { team1: true, team2: true, winner: true, game: true, results: true } },
                    },
                },
            },
        });
        if (!season) {
            console.error('season not found');
            return;
        }
        const teamPlayers = Object.fromEntries(season.teams.map((team) => [team.id, team.members.map((member) => member.user.name)]));
        const teamNames = Object.fromEntries(season.teams.map((team) => [team.id, team.name]));
        const matches = season.tournaments.flatMap((tournament) => tournament.matches.map((match) => (0, history_core_1.normalizeMatch)(match)));
        const allTeamIds = Array.from(new Set(matches.flatMap((match) => [match.team1Id, match.team2Id])));
        console.log('allTeamIds count', allTeamIds.length);
        console.log('allTeamIds', allTeamIds.map((id) => `${id}:${teamNames[id] || id}`));
        const stageSummary = matches.reduce((acc, match) => {
            const stage = match.stage || 'null';
            if (!acc[stage])
                acc[stage] = { count: 0, teamIds: new Set(), pairKeys: new Map() };
            const entry = acc[stage];
            entry.count += 1;
            entry.teamIds.add(match.team1Id);
            entry.teamIds.add(match.team2Id);
            const key = [match.team1Id, match.team2Id].sort().join('|');
            entry.pairKeys.set(key, (entry.pairKeys.get(key) || 0) + 1);
            return acc;
        }, {});
        console.log('stageSummary', JSON.stringify(Object.entries(stageSummary).map(([stage, summary]) => ({ stage, count: summary.count, teamCount: summary.teamIds.size, pairs: Array.from(summary.pairKeys.entries()) })), null, 2));
        const finals = matches.filter((match) => match.stage === 'final');
        const thirds = matches.filter((match) => match.stage === 'third_place');
        console.log('finals', finals.length, finals.map((m) => ({ id: m.id, teams: [m.team1Id, m.team2Id].map((id) => teamNames[id]), winner: m.winnerId ? teamNames[m.winnerId] : null })));
        console.log('thirds', thirds.length, thirds.map((m) => ({ id: m.id, teams: [m.team1Id, m.team2Id].map((id) => teamNames[id]), winner: m.winnerId ? teamNames[m.winnerId] : null })));
        const summary = (0, history_core_1.buildGroupKoStandings)(matches, teamPlayers, teamNames);
        console.log('summary isComplete', summary.isComplete);
        console.log('summary standings count', summary.standings.length);
        console.log('duplicate counts', JSON.stringify(summary.standings.reduce((acc, s) => { acc[s.teamId] = (acc[s.teamId] || 0) + 1; return acc; }, {}), null, 2));
        console.log(JSON.stringify(summary.standings.map((s) => ({ teamId: s.teamId, teamName: s.teamName, rank: s.rank, points: s.points, isCertain: s.isCertain })), null, 2));
        const rankedTeamIds = new Set(summary.standings.map((s) => s.teamId));
        const duplicates = summary.standings.filter((s, index) => summary.standings.findIndex((other) => other.teamId === s.teamId) !== index);
        console.log('duplicate entries by index', JSON.stringify(duplicates, null, 2));
    }
    catch (err) {
        console.error(err);
    }
    finally {
        yield prisma.$disconnect();
    }
}))();
