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
exports.calculatePlacementPoints = calculatePlacementPoints;
exports.calculateGroupKoStandings = calculateGroupKoStandings;
exports.buildSeasonSummary = buildSeasonSummary;
exports.buildSeasonDetail = buildSeasonDetail;
exports.buildPlayerStatistics = buildPlayerStatistics;
exports.progressTournament = progressTournament;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function calculatePlacementPoints(place, totalTeams) {
    return Math.max(totalTeams - place, 0);
}
function dateToISOString(value) {
    if (!value)
        return null;
    return new Date(value).toISOString();
}
function normalizeMatch(match) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const team1Score = (_b = (_a = match.results.find((r) => r.teamId === match.team1Id)) === null || _a === void 0 ? void 0 : _a.score) !== null && _b !== void 0 ? _b : null;
    const team2Score = (_d = (_c = match.results.find((r) => r.teamId === match.team2Id)) === null || _c === void 0 ? void 0 : _c.score) !== null && _d !== void 0 ? _d : null;
    const comment = (_h = (_f = (_e = match.results.find((r) => r.teamId === match.team1Id)) === null || _e === void 0 ? void 0 : _e.comment) !== null && _f !== void 0 ? _f : (_g = match.results.find((r) => r.teamId === match.team2Id)) === null || _g === void 0 ? void 0 : _g.comment) !== null && _h !== void 0 ? _h : null;
    return {
        id: match.id,
        tournamentId: match.tournamentId,
        gameId: match.gameId,
        gameName: match.game.name,
        stage: match.stage,
        groupName: match.groupName,
        team1Id: match.team1Id,
        team2Id: match.team2Id,
        team1Name: match.team1.name,
        team2Name: match.team2.name,
        winnerId: match.winnerId,
        winnerName: (_k = (_j = match.winner) === null || _j === void 0 ? void 0 : _j.name) !== null && _k !== void 0 ? _k : null,
        scheduledAt: dateToISOString(match.scheduledAt),
        playedAt: dateToISOString(match.playedAt),
        team1Score,
        team2Score,
        comment,
        isPlayed: !!match.winnerId,
    };
}
function buildTeamPlayers(teams) {
    const map = {};
    for (const team of teams) {
        map[team.id] = team.members
            .map((member) => member.user.name)
            .filter((name) => !!name);
    }
    return map;
}
function createBaseTeamStats(teamPlayers, teamNames) {
    var _a;
    const stats = {};
    for (const [teamId, players] of Object.entries(teamPlayers)) {
        stats[teamId] = {
            teamId,
            teamName: (_a = teamNames[teamId]) !== null && _a !== void 0 ? _a : teamId,
            players,
            games: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            scoreFor: 0,
            scoreAgainst: 0,
            scoreDiff: 0,
            headToHead: {},
            points: 0,
            rank: 0,
            isCertain: true,
        };
    }
    return stats;
}
function sortTeamStats(stats) {
    return [...stats].sort((a, b) => {
        if (b.wins !== a.wins)
            return b.wins - a.wins;
        const headToHead = (b.headToHead[a.teamId] || 0) - (a.headToHead[b.teamId] || 0);
        if (headToHead !== 0)
            return headToHead;
        if (b.scoreDiff !== a.scoreDiff)
            return b.scoreDiff - a.scoreDiff;
        const nameCompare = a.teamName.localeCompare(b.teamName);
        if (nameCompare !== 0)
            return nameCompare;
        return a.teamId.localeCompare(b.teamId);
    });
}
function computeTeamStats(matches, teamPlayers, teamNames) {
    var _a, _b;
    const statsMap = createBaseTeamStats(teamPlayers, teamNames);
    let isComplete = true;
    for (const match of matches) {
        const team1 = statsMap[match.team1Id];
        const team2 = statsMap[match.team2Id];
        if (!team1 || !team2)
            continue;
        if (!match.winnerId) {
            isComplete = false;
            continue;
        }
        team1.games += 1;
        team2.games += 1;
        const winner = match.winnerId === match.team1Id ? team1 : team2;
        const loser = winner === team1 ? team2 : team1;
        winner.wins += 1;
        loser.losses += 1;
        winner.headToHead[loser.teamId] =
            (winner.headToHead[loser.teamId] || 0) + 1;
        loser.headToHead[winner.teamId] = loser.headToHead[winner.teamId] || 0;
        const score1 = (_a = match.team1Score) !== null && _a !== void 0 ? _a : 0;
        const score2 = (_b = match.team2Score) !== null && _b !== void 0 ? _b : 0;
        team1.scoreFor += score1;
        team1.scoreAgainst += score2;
        team2.scoreFor += score2;
        team2.scoreAgainst += score1;
        team1.scoreDiff = team1.scoreFor - team1.scoreAgainst;
        team2.scoreDiff = team2.scoreFor - team2.scoreAgainst;
    }
    const totals = Object.values(statsMap);
    for (const stat of totals) {
        stat.winRate = stat.games > 0 ? stat.wins / stat.games : 0;
    }
    return { stats: totals, isComplete };
}
function buildRoundRobinStandings(matches, teamPlayers, teamNames) {
    const { stats, isComplete } = computeTeamStats(matches, teamPlayers, teamNames);
    const sorted = sortTeamStats(stats);
    const totalTeams = sorted.length;
    return {
        standings: sorted.map((entry, index) => (Object.assign(Object.assign({}, entry), { rank: index + 1, points: calculatePlacementPoints(index + 1, totalTeams), isCertain: isComplete }))),
        isComplete,
        groupStandings: undefined,
        knockoutMatches: undefined,
    };
}
function buildGroupStandings(matches, teamPlayers, teamNames) {
    const grouped = {};
    for (const match of matches) {
        const group = match.groupName || "A";
        grouped[group] = grouped[group] || [];
        grouped[group].push(match);
    }
    return Object.keys(grouped)
        .sort()
        .map((groupName) => {
        const { stats } = computeTeamStats(grouped[groupName], teamPlayers, teamNames);
        const sorted = sortTeamStats(stats).map((entry, index) => (Object.assign(Object.assign({}, entry), { rank: index + 1, points: calculatePlacementPoints(index + 1, stats.length) })));
        return { groupName, standings: sorted };
    });
}
function buildGroupKoStandings(matches, teamPlayers, teamNames) {
    var _a, _b;
    const groupMatches = matches.filter((match) => match.stage === "group");
    const nonGroupMatches = matches.filter((match) => match.stage !== "group");
    const groupStandings = buildGroupStandings(groupMatches, teamPlayers, teamNames);
    const allTeamIds = Array.from(new Set(matches.flatMap((match) => [match.team1Id, match.team2Id])));
    const teamNamesMap = teamNames;
    const finalMatch = matches.find((match) => match.stage === "final");
    const thirdMatch = matches.find((match) => match.stage === "third_place");
    const allMatchesComplete = matches.every((match) => match.winnerId);
    const isComplete = allMatchesComplete && !!finalMatch && !!thirdMatch;
    const groupRank = new Map();
    for (const group of groupStandings) {
        for (const entry of group.standings) {
            groupRank.set(entry.teamId, entry.rank);
        }
    }
    const rankByTeam = new Map();
    const pushRank = (teamId, rank, isCertain) => {
        const existing = rankByTeam.get(teamId);
        if (!existing || rank < existing.rank) {
            rankByTeam.set(teamId, { rank, isCertain });
        }
    };
    if (finalMatch && finalMatch.winnerId) {
        const finalLoser = finalMatch.team1Id === finalMatch.winnerId
            ? finalMatch.team2Id
            : finalMatch.team1Id;
        pushRank(finalMatch.winnerId, 1, true);
        pushRank(finalLoser, 2, true);
    }
    if (thirdMatch && thirdMatch.winnerId) {
        const thirdLoser = thirdMatch.team1Id === thirdMatch.winnerId
            ? thirdMatch.team2Id
            : thirdMatch.team1Id;
        pushRank(thirdMatch.winnerId, 3, true);
        pushRank(thirdLoser, 4, true);
    }
    const overallRanks = Array.from(rankByTeam.entries())
        .map(([teamId, info]) => ({
        teamId,
        rank: info.rank,
        isCertain: info.isCertain,
    }))
        .sort((a, b) => a.rank - b.rank);
    const rankedTeamIds = new Set(overallRanks.map((item) => item.teamId));
    const remainingTeamIds = allTeamIds.filter((id) => !rankedTeamIds.has(id));
    const remainingMatches = matches.filter((match) => remainingTeamIds.includes(match.team1Id) &&
        remainingTeamIds.includes(match.team2Id));
    const { stats: remainingStats } = computeTeamStats(remainingMatches, teamPlayers, teamNamesMap);
    const sortedRemaining = sortTeamStats(remainingStats).sort((a, b) => {
        var _a, _b;
        const rankA = (_a = groupRank.get(a.teamId)) !== null && _a !== void 0 ? _a : Number.MAX_SAFE_INTEGER;
        const rankB = (_b = groupRank.get(b.teamId)) !== null && _b !== void 0 ? _b : Number.MAX_SAFE_INTEGER;
        if (rankA !== rankB)
            return rankA - rankB;
        return 0;
    });
    let nextRank = overallRanks.length + 1;
    for (const entry of sortedRemaining) {
        overallRanks.push({
            teamId: entry.teamId,
            rank: nextRank++,
            isCertain: groupMatches.every((m) => m.winnerId),
        });
    }
    const teamStats = createBaseTeamStats(teamPlayers, teamNamesMap);
    for (const match of matches) {
        const team1 = teamStats[match.team1Id];
        const team2 = teamStats[match.team2Id];
        if (!team1 || !team2)
            continue;
        if (!match.winnerId)
            continue;
        team1.games += 1;
        team2.games += 1;
        const winner = match.winnerId === match.team1Id ? team1 : team2;
        const loser = winner === team1 ? team2 : team1;
        winner.wins += 1;
        loser.losses += 1;
        winner.headToHead[loser.teamId] =
            (winner.headToHead[loser.teamId] || 0) + 1;
        loser.headToHead[winner.teamId] = loser.headToHead[winner.teamId] || 0;
        const score1 = (_a = match.team1Score) !== null && _a !== void 0 ? _a : 0;
        const score2 = (_b = match.team2Score) !== null && _b !== void 0 ? _b : 0;
        team1.scoreFor += score1;
        team1.scoreAgainst += score2;
        team2.scoreFor += score2;
        team2.scoreAgainst += score1;
        team1.scoreDiff = team1.scoreFor - team1.scoreAgainst;
        team2.scoreDiff = team2.scoreFor - team2.scoreAgainst;
    }
    for (const stat of Object.values(teamStats)) {
        stat.winRate = stat.games > 0 ? stat.wins / stat.games : 0;
    }
    const orderedStats = overallRanks
        .map((rankInfo) => {
        const stat = teamStats[rankInfo.teamId];
        if (!stat)
            return null;
        return Object.assign(Object.assign({}, stat), { rank: rankInfo.rank, points: calculatePlacementPoints(rankInfo.rank, allTeamIds.length), isCertain: rankInfo.isCertain &&
                groupMatches.every((m) => m.winnerId) &&
                (!finalMatch || !!finalMatch.winnerId) &&
                (!thirdMatch || !!thirdMatch.winnerId) });
    })
        .filter((stat) => Boolean(stat));
    return {
        standings: orderedStats,
        groupStandings,
        knockoutMatches: nonGroupMatches,
        isComplete,
    };
}
function calculateGroupKoStandings(matches) {
    const normalizedMatches = matches.map((match) => {
        var _a, _b, _c, _d, _e;
        return normalizeMatch(Object.assign(Object.assign({}, match), { game: (_a = match.game) !== null && _a !== void 0 ? _a : { id: match.gameId, name: match.gameId }, results: (_b = match.results) !== null && _b !== void 0 ? _b : [], team1: (_c = match.team1) !== null && _c !== void 0 ? _c : { id: match.team1Id, name: match.team1Id }, team2: (_d = match.team2) !== null && _d !== void 0 ? _d : { id: match.team2Id, name: match.team2Id }, winner: (_e = match.winner) !== null && _e !== void 0 ? _e : null }));
    });
    const teamIds = Array.from(new Set(normalizedMatches.flatMap((match) => [match.team1Id, match.team2Id])));
    const teamNames = Object.fromEntries(teamIds.map((teamId) => [teamId, teamId]));
    const teamPlayers = Object.fromEntries(teamIds.map((teamId) => [teamId, []]));
    const standings = buildGroupKoStandings(normalizedMatches, teamPlayers, teamNames).standings;
    return standings.map((standing) => ({
        teamId: standing.teamId,
        teamName: standing.teamName,
        rank: standing.rank,
        points: standing.points,
        isCertain: standing.isCertain,
    }));
}
function buildSeasonSummary(season) {
    var _a, _b;
    const allMatches = season.tournaments.flatMap((tournament) => tournament.matches.map(normalizeMatch));
    const allTeamPlayers = buildTeamPlayers(season.teams);
    const teamNames = Object.fromEntries(season.teams.map((team) => [team.id, team.name]));
    const gameSummaries = buildSeasonGames(season.tournaments, allTeamPlayers, teamNames);
    const overallStandings = buildOverallStandings(allMatches, allTeamPlayers, teamNames, gameSummaries);
    const champion = ((_a = overallStandings[0]) === null || _a === void 0 ? void 0 : _a.rank) === 1 && ((_b = overallStandings[0]) === null || _b === void 0 ? void 0 : _b.isCertain)
        ? {
            teamId: overallStandings[0].teamId,
            teamName: overallStandings[0].teamName,
            players: overallStandings[0].players,
        }
        : null;
    return {
        id: season.id,
        year: season.year,
        name: season.name,
        finishedAt: new Date(season.finishedAt).toISOString(),
        tournamentSystems: Array.from(new Set(season.tournaments.map((t) => t.system))),
        location: Array.from(new Set(season.tournaments.map((t) => t.location).filter(Boolean))).join(", ") || null,
        teamCount: season.teams.length,
        playerCount: new Set(season.teams.flatMap((team) => team.members.map((member) => member.user.id))).size,
        gameCount: new Set(allMatches.map((match) => match.gameId)).size,
        matchCount: allMatches.length,
        champion,
        isComplete: gameSummaries.every((game) => game.isComplete),
    };
}
function buildSeasonGames(tournaments, teamPlayers, teamNames) {
    const gameBuckets = {};
    for (const tournament of tournaments) {
        for (const match of tournament.matches) {
            const key = `${tournament.id}_${match.gameId}`;
            gameBuckets[key] = gameBuckets[key] || { tournament, matches: [] };
            gameBuckets[key].matches.push(normalizeMatch(match));
        }
    }
    return Object.entries(gameBuckets).map(([key, bucket]) => {
        var _a, _b, _c, _d;
        const tournament = bucket.tournament;
        const matches = bucket.matches;
        const system = tournament.system;
        const { standings, isComplete, groupStandings, knockoutMatches } = system === "group_ko"
            ? buildGroupKoStandings(matches, teamPlayers, teamNames)
            : buildRoundRobinStandings(matches, teamPlayers, teamNames);
        return {
            tournamentId: tournament.id,
            gameId: (_b = (_a = matches[0]) === null || _a === void 0 ? void 0 : _a.gameId) !== null && _b !== void 0 ? _b : "",
            gameName: (_d = (_c = matches[0]) === null || _c === void 0 ? void 0 : _c.gameName) !== null && _d !== void 0 ? _d : "Unbekannt",
            system,
            location: tournament.location,
            matchCount: matches.length,
            isComplete,
            standings,
            groupStandings: (groupStandings === null || groupStandings === void 0 ? void 0 : groupStandings.length) ? groupStandings : undefined,
            knockoutMatches: (knockoutMatches === null || knockoutMatches === void 0 ? void 0 : knockoutMatches.length) ? knockoutMatches : undefined,
            matches,
        };
    });
}
function buildOverallStandings(matches, teamPlayers, teamNames, gameSummaries) {
    const { stats, isComplete } = computeTeamStats(matches, teamPlayers, teamNames);
    const pointsByTeam = {};
    const overallIsCertain = isComplete &&
        (!gameSummaries || gameSummaries.every((game) => game.isComplete));
    if (gameSummaries) {
        for (const game of gameSummaries) {
            for (const standing of game.standings) {
                pointsByTeam[standing.teamId] =
                    (pointsByTeam[standing.teamId] || 0) + standing.points;
            }
        }
    }
    else {
        const totalTeams = stats.length;
        const ranked = sortTeamStats(stats).map((entry, index) => (Object.assign(Object.assign({}, entry), { rank: index + 1 })));
        for (const entry of ranked) {
            pointsByTeam[entry.teamId] = calculatePlacementPoints(entry.rank, totalTeams);
        }
    }
    const sorted = [...stats].sort((a, b) => {
        const aPoints = pointsByTeam[a.teamId] || 0;
        const bPoints = pointsByTeam[b.teamId] || 0;
        if (bPoints !== aPoints)
            return bPoints - aPoints;
        if (b.wins !== a.wins)
            return b.wins - a.wins;
        const headToHead = (b.headToHead[a.teamId] || 0) - (a.headToHead[b.teamId] || 0);
        if (headToHead !== 0)
            return headToHead;
        if (b.scoreDiff !== a.scoreDiff)
            return b.scoreDiff - a.scoreDiff;
        const nameCompare = a.teamName.localeCompare(b.teamName);
        if (nameCompare !== 0)
            return nameCompare;
        return a.teamId.localeCompare(b.teamId);
    });
    return sorted.map((entry, index) => (Object.assign(Object.assign({}, entry), { rank: index + 1, points: pointsByTeam[entry.teamId] || 0, isCertain: overallIsCertain })));
}
function buildSeasonDetail(season) {
    var _a, _b;
    const allMatches = season.tournaments.flatMap((tournament) => tournament.matches.map(normalizeMatch));
    const teamPlayers = buildTeamPlayers(season.teams);
    const teamNames = Object.fromEntries(season.teams.map((team) => [team.id, team.name]));
    const games = buildSeasonGames(season.tournaments, teamPlayers, teamNames);
    const overallStandings = buildOverallStandings(allMatches, teamPlayers, teamNames, games);
    const isComplete = games.every((game) => game.isComplete);
    const champion = ((_a = overallStandings[0]) === null || _a === void 0 ? void 0 : _a.rank) === 1 && ((_b = overallStandings[0]) === null || _b === void 0 ? void 0 : _b.isCertain)
        ? {
            teamId: overallStandings[0].teamId,
            teamName: overallStandings[0].teamName,
            players: overallStandings[0].players,
        }
        : null;
    return {
        id: season.id,
        year: season.year,
        name: season.name,
        finishedAt: new Date(season.finishedAt).toISOString(),
        tournamentSystems: Array.from(new Set(season.tournaments.map((t) => t.system))),
        location: Array.from(new Set(season.tournaments.map((t) => t.location).filter(Boolean))).join(", ") || null,
        teamCount: season.teams.length,
        playerCount: new Set(season.teams.flatMap((team) => team.members.map((member) => member.user.id))).size,
        gameCount: new Set(allMatches.map((match) => match.gameId)).size,
        matchCount: allMatches.length,
        champion,
        isComplete,
        overallStandings,
        games,
        matches: allMatches,
    };
}
function buildPlayerStatistics(seasons) {
    var _a, _b;
    const playerMap = {};
    for (const season of seasons) {
        const teamById = Object.fromEntries(season.games.flatMap((game) => game.standings.map((standing) => [standing.teamId, standing])));
        const teamPlayers = new Map();
        for (const game of season.games) {
            for (const standing of game.standings) {
                teamPlayers.set(standing.teamId, standing.players);
            }
        }
        for (const standing of season.overallStandings) {
            const teamId = standing.teamId;
            const playerNames = (_a = teamPlayers.get(teamId)) !== null && _a !== void 0 ? _a : [];
            for (const playerName of playerNames) {
                const playerId = `${season.id}-${teamId}-${playerName}`;
            }
        }
        const teamDetail = Object.fromEntries(season.overallStandings.map((standing) => [standing.teamId, standing]));
        const membershipMap = {};
        for (const team of season.games
            .flatMap((game) => game.standings)
            .map((standing) => ({
            teamId: standing.teamId,
            players: standing.players,
        }))) {
            membershipMap[team.teamId] = team.players;
        }
        for (const [teamId, standing] of Object.entries(teamDetail)) {
            const players = (_b = membershipMap[teamId]) !== null && _b !== void 0 ? _b : [];
            for (const playerName of players) {
                const playerId = `${playerName}`;
                const summary = playerMap[playerId] || {
                    playerId,
                    playerName,
                    seasons: 0,
                    wonSeasons: 0,
                    podiums: 0,
                    averagePlacement: 0,
                    bestPlacement: Number.MAX_SAFE_INTEGER,
                    worstPlacement: 0,
                    averageGamePlacement: 0,
                    matchCount: 0,
                    wins: 0,
                    losses: 0,
                    winRate: 0,
                    totalPlacementPoints: 0,
                    averagePlacementPoints: 0,
                    teamNames: [],
                    placements: [],
                    gamePlacements: [],
                    teamNamesSet: new Set(),
                };
                summary.seasons += 1;
                if (standing.rank === 1 && season.isComplete)
                    summary.wonSeasons += 1;
                if (standing.rank <= 3 && season.isComplete)
                    summary.podiums += 1;
                summary.placements.push(standing.rank);
                summary.bestPlacement = Math.min(summary.bestPlacement, standing.rank);
                summary.worstPlacement = Math.max(summary.worstPlacement, standing.rank);
                summary.totalPlacementPoints += standing.points;
                summary.teamNamesSet.add(standing.teamName);
                for (const game of season.games) {
                    const gameStanding = game.standings.find((entry) => entry.teamId === teamId);
                    if (gameStanding) {
                        summary.gamePlacements.push(gameStanding.rank);
                    }
                }
            }
        }
    }
    return Object.values(playerMap).map((summary) => {
        const seasonsCount = summary.seasons;
        const averagePlacement = seasonsCount > 0
            ? summary.placements.reduce((sum, value) => sum + value, 0) /
                seasonsCount
            : 0;
        const averageGamePlacement = summary.gamePlacements.length > 0
            ? summary.gamePlacements.reduce((sum, value) => sum + value, 0) /
                summary.gamePlacements.length
            : 0;
        return {
            playerId: summary.playerId,
            playerName: summary.playerName,
            seasons: seasonsCount,
            wonSeasons: summary.wonSeasons,
            podiums: summary.podiums,
            averagePlacement,
            bestPlacement: summary.bestPlacement === Number.MAX_SAFE_INTEGER
                ? 0
                : summary.bestPlacement,
            worstPlacement: summary.worstPlacement,
            averageGamePlacement,
            matchCount: summary.matchCount,
            wins: summary.wins,
            losses: summary.losses,
            winRate: 0,
            totalPlacementPoints: summary.totalPlacementPoints,
            averagePlacementPoints: seasonsCount > 0 ? summary.totalPlacementPoints / seasonsCount : 0,
            teamNames: Array.from(summary.teamNamesSet).sort(),
        };
    });
}
function progressTournament(tournamentId) {
    return __awaiter(this, void 0, void 0, function* () {
        const tournament = yield prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { matches: true },
        });
        if (!tournament || tournament.system !== "group_ko")
            return;
        const games = Array.from(new Set(tournament.matches.map((m) => m.gameId)));
        for (const gameId of games) {
            const byStage = (stage) => tournament.matches.filter((m) => m.gameId === gameId && m.stage === stage);
            const groupMatches = byStage("group");
            if (groupMatches.length > 0 && groupMatches.every((m) => m.winnerId)) {
                const semiExists = byStage("semi_final").length > 0;
                if (!semiExists) {
                    const groups = {};
                    for (const m of groupMatches) {
                        if (!m.groupName)
                            continue;
                        groups[m.groupName] = groups[m.groupName] || [];
                        if (!groups[m.groupName].includes(m.team1Id))
                            groups[m.groupName].push(m.team1Id);
                        if (!groups[m.groupName].includes(m.team2Id))
                            groups[m.groupName].push(m.team2Id);
                    }
                    const standings = {};
                    for (const m of groupMatches) {
                        const g = m.groupName;
                        standings[g] =
                            standings[g] || groups[g].map((t) => ({ teamId: t, points: 0 }));
                        const entry = standings[g].find((s) => s.teamId === m.winnerId);
                        if (entry)
                            entry.points += 1;
                    }
                    for (const g of Object.keys(standings)) {
                        standings[g].sort((a, b) => b.points - a.points);
                    }
                    yield prisma.match.create({
                        data: {
                            tournamentId,
                            gameId,
                            team1Id: standings["A"][0].teamId,
                            team2Id: standings["B"][1].teamId,
                            stage: "semi_final",
                        },
                    });
                    yield prisma.match.create({
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
                    yield prisma.match.create({
                        data: {
                            tournamentId,
                            gameId,
                            team1Id: s1.winnerId,
                            team2Id: s2.winnerId,
                            stage: "final",
                        },
                    });
                    yield prisma.match.create({
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
    });
}
