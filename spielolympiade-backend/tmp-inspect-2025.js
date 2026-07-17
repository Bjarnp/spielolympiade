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
const prisma = new client_1.PrismaClient();
(() => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const season = yield prisma.season.findFirst({
            where: { year: 2025 },
            include: {
                teams: true,
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
            process.exit(1);
        }
        const matches = season.tournaments.flatMap((t) => t.matches);
        const byStage = {};
        for (const match of matches) {
            const stage = (_a = match.stage) !== null && _a !== void 0 ? _a : "null";
            byStage[stage] = byStage[stage] || [];
            byStage[stage].push(match);
        }
        console.log("stageCounts", Object.fromEntries(Object.entries(byStage).map(([stage, list]) => [stage, list.length])));
        for (const stage of ["group", "semi_final", "third_place", "final"]) {
            const group = byStage[stage] || [];
            if (!group.length)
                continue;
            console.log(`\n=== ${stage} (${group.length}) ===`);
            const teamIds = Array.from(new Set(group.flatMap((m) => [m.team1Id, m.team2Id])));
            console.log("unique team ids", teamIds.length, teamIds);
            const pairKeys = group.map((m) => [m.team1Id, m.team2Id].sort().join("|"));
            const uniquePairs = Array.from(new Set(pairKeys));
            console.log("uniquePairs", uniquePairs.length);
            const teamMatchCount = teamIds
                .map((teamId) => ({
                teamId,
                count: group.filter((m) => m.team1Id === teamId || m.team2Id === teamId).length,
            }))
                .sort((a, b) => b.count - a.count || a.teamId.localeCompare(b.teamId));
            console.log("teamMatchCount", teamMatchCount);
            const winners = group
                .map((m) => m.winnerId)
                .filter((id) => !!id);
            console.log("winner ids unique", Array.from(new Set(winners)));
            console.log("winners by count", Array.from(new Set(winners)).map((id) => ({
                id,
                count: winners.filter((w) => w === id).length,
            })));
        }
    }
    catch (err) {
        console.error(err);
    }
    finally {
        yield prisma.$disconnect();
    }
}))();
