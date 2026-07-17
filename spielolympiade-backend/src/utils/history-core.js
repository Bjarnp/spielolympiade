"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePlacementPoints = calculatePlacementPoints;
exports.normalizeMatch = normalizeMatch;
exports.buildTeamPlayers = buildTeamPlayers;
exports.buildTeamMemberIds = buildTeamMemberIds;
exports.buildTeamNames = buildTeamNames;
exports.createBaseTeamStats = createBaseTeamStats;
exports.deterministicSortTeamStats = deterministicSortTeamStats;
exports.computeTeamStats = computeTeamStats;
exports.buildRoundRobinStandings = buildRoundRobinStandings;
exports.buildGroupStandings = buildGroupStandings;
exports.buildGroupKoStandings = buildGroupKoStandings;
exports.buildSeasonGameSummary = buildSeasonGameSummary;
exports.buildOverallStandings = buildOverallStandings;
exports.buildSeasonOverallDebug = buildSeasonOverallDebug;
exports.buildSeasonSummary = buildSeasonSummary;
exports.buildSeasonDetail = buildSeasonDetail;
exports.buildPlayerStatsSummaries = buildPlayerStatsSummaries;
exports.buildPlayerStatsDetail = buildPlayerStatsDetail;
function calculatePlacementPoints(place, totalTeams) {
    return Math.max(totalTeams - place, 0);
}
function normalizeMatch(match) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const team1Score = (_b = (_a = match.results.find((result) => result.teamId === match.team1Id)) === null || _a === void 0 ? void 0 : _a.score) !== null && _b !== void 0 ? _b : null;
    const team2Score = (_d = (_c = match.results.find((result) => result.teamId === match.team2Id)) === null || _c === void 0 ? void 0 : _c.score) !== null && _d !== void 0 ? _d : null;
    const comment = (_h = (_f = (_e = match.results.find((result) => result.teamId === match.team1Id)) === null || _e === void 0 ? void 0 : _e.comment) !== null && _f !== void 0 ? _f : (_g = match.results.find((result) => result.teamId === match.team2Id)) === null || _g === void 0 ? void 0 : _g.comment) !== null && _h !== void 0 ? _h : null;
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
        scheduledAt: match.scheduledAt ? new Date(match.scheduledAt).toISOString() : null,
        playedAt: match.playedAt ? new Date(match.playedAt).toISOString() : null,
        team1Score,
        team2Score,
        comment,
        isPlayed: !!match.winnerId,
    };
}
function buildTeamPlayers(teams) {
    const mapping = {};
    for (const team of teams) {
        mapping[team.id] = team.members.map((member) => member.user.name).filter((name) => !!name);
    }
    return mapping;
}
function buildTeamMemberIds(teams) {
    const mapping = {};
    for (const team of teams) {
        mapping[team.id] = team.members.map((member) => member.user.id).filter((id) => !!id);
    }
    return mapping;
}
function buildTeamNames(teams) {
    return Object.fromEntries(teams.map((team) => [team.id, team.name]));
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
function deterministicSortTeamStats(stats) {
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
        winner.headToHead[loser.teamId] = (winner.headToHead[loser.teamId] || 0) + 1;
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
    const stats = Object.values(statsMap);
    for (const entry of stats) {
        entry.winRate = entry.games > 0 ? entry.wins / entry.games : 0;
    }
    return { stats, isComplete };
}
function buildRoundRobinStandings(matches, teamPlayers, teamNames) {
    const { stats, isComplete } = computeTeamStats(matches, teamPlayers, teamNames);
    const sorted = deterministicSortTeamStats(stats);
    const totalTeams = sorted.length;
    return {
        standings: sorted.map((entry, index) => (Object.assign(Object.assign({}, entry), { rank: index + 1, points: calculatePlacementPoints(index + 1, totalTeams), isCertain: isComplete }))),
        isComplete,
    };
}
function buildGroupStandings(matches, teamPlayers, teamNames) {
    const groups = {};
    for (const match of matches) {
        const groupName = match.groupName || "A";
        groups[groupName] = groups[groupName] || [];
        groups[groupName].push(match);
    }
    return Object.keys(groups)
        .sort()
        .map((groupName) => {
        const { stats } = computeTeamStats(groups[groupName], teamPlayers, teamNames);
        const sorted = deterministicSortTeamStats(stats).map((entry, index) => (Object.assign(Object.assign({}, entry), { rank: index + 1, points: calculatePlacementPoints(index + 1, stats.length) })));
        return { groupName, standings: sorted };
    });
}
function buildGroupKoStandings(matches, teamPlayers, teamNames) {
    var _a, _b;
    const groupMatches = matches.filter((match) => match.stage === "group");
    const knockoutMatches = matches.filter((match) => match.stage !== "group");
    const groupStandings = buildGroupStandings(groupMatches, teamPlayers, teamNames);
    const allTeamIds = Array.from(new Set(matches.flatMap((match) => [match.team1Id, match.team2Id])));
    const finalMatch = knockoutMatches.find((match) => match.stage === "final");
    const thirdMatch = knockoutMatches.find((match) => match.stage === "third_place");
    const allMatchesComplete = matches.every((match) => match.winnerId);
    const isComplete = allMatchesComplete && !!finalMatch && !!thirdMatch;
    const rankByTeam = new Map();
    const pushRank = (teamId, rank, isCertain) => {
        const existing = rankByTeam.get(teamId);
        if (!existing || rank < existing.rank) {
            rankByTeam.set(teamId, { rank, isCertain });
        }
    };
    if (finalMatch && finalMatch.winnerId) {
        const finalLoser = finalMatch.team1Id === finalMatch.winnerId ? finalMatch.team2Id : finalMatch.team1Id;
        pushRank(finalMatch.winnerId, 1, true);
        pushRank(finalLoser, 2, true);
    }
    if (thirdMatch && thirdMatch.winnerId) {
        const thirdLoser = thirdMatch.team1Id === thirdMatch.winnerId ? thirdMatch.team2Id : thirdMatch.team1Id;
        pushRank(thirdMatch.winnerId, 3, true);
        pushRank(thirdLoser, 4, true);
    }
    const overallRankings = Array.from(rankByTeam.entries())
        .map(([teamId, info]) => ({ teamId, rank: info.rank, isCertain: info.isCertain }))
        .sort((a, b) => a.rank - b.rank);
    const rankedIds = new Set(overallRankings.map((entry) => entry.teamId));
    const remainingTeamIds = allTeamIds.filter((teamId) => !rankedIds.has(teamId));
    const groupRankMap = new Map();
    const groupKeyMap = new Map();
    for (const group of groupStandings) {
        for (const entry of group.standings) {
            groupRankMap.set(entry.teamId, entry.rank);
            groupKeyMap.set(entry.teamId, group.groupName);
        }
    }
    const remainingSorted = remainingTeamIds
        .map((teamId) => {
        var _a, _b, _c;
        return ({
            teamId,
            groupRank: (_a = groupRankMap.get(teamId)) !== null && _a !== void 0 ? _a : Number.MAX_SAFE_INTEGER,
            groupName: (_b = groupKeyMap.get(teamId)) !== null && _b !== void 0 ? _b : "",
            teamName: (_c = teamNames[teamId]) !== null && _c !== void 0 ? _c : teamId,
        });
    })
        .sort((a, b) => {
        if (a.groupRank !== b.groupRank)
            return a.groupRank - b.groupRank;
        if (a.groupName !== b.groupName)
            return a.groupName.localeCompare(b.groupName);
        const nameCompare = a.teamName.localeCompare(b.teamName);
        if (nameCompare !== 0)
            return nameCompare;
        return a.teamId.localeCompare(b.teamId);
    });
    let nextRank = overallRankings.length + 1;
    const groupMatchesComplete = groupMatches.every((match) => match.winnerId);
    for (const entry of remainingSorted) {
        overallRankings.push({
            teamId: entry.teamId,
            rank: nextRank++,
            isCertain: groupMatchesComplete,
        });
    }
    const teamStats = createBaseTeamStats(teamPlayers, teamNames);
    for (const match of matches) {
        if (!match.winnerId)
            continue;
        const team1 = teamStats[match.team1Id];
        const team2 = teamStats[match.team2Id];
        if (!team1 || !team2)
            continue;
        team1.games += 1;
        team2.games += 1;
        const winner = match.winnerId === match.team1Id ? team1 : team2;
        const loser = winner === team1 ? team2 : team1;
        winner.wins += 1;
        loser.losses += 1;
        winner.headToHead[loser.teamId] = (winner.headToHead[loser.teamId] || 0) + 1;
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
    const standings = overallRankings
        .map((rankInfo) => {
        const stat = teamStats[rankInfo.teamId];
        if (!stat)
            return null;
        return Object.assign(Object.assign({}, stat), { rank: rankInfo.rank, points: calculatePlacementPoints(rankInfo.rank, allTeamIds.length), isCertain: rankInfo.isCertain && groupMatchesComplete && (!finalMatch || !!finalMatch.winnerId) && (!thirdMatch || !!thirdMatch.winnerId) });
    })
        .filter((entry) => Boolean(entry));
    return {
        standings,
        groupStandings,
        knockoutMatches,
        isComplete,
    };
}
function buildSeasonGameSummary(tournamentId, system, location, matches, teamPlayers, teamNames) {
    var _a, _b, _c, _d;
    const matchCount = matches.length;
    let summary;
    if (system === "group_ko") {
        const groupSummary = buildGroupKoStandings(matches, teamPlayers, teamNames);
        summary = {
            standings: groupSummary.standings,
            isComplete: groupSummary.isComplete,
            groupStandings: groupSummary.groupStandings,
            knockoutMatches: groupSummary.knockoutMatches.sort((a, b) => {
                var _a, _b, _c, _d;
                const order = ["semi_final", "extra", "third_place", "final"];
                const aIndex = order.indexOf((_a = a.stage) !== null && _a !== void 0 ? _a : "");
                const bIndex = order.indexOf((_b = b.stage) !== null && _b !== void 0 ? _b : "");
                if (aIndex !== bIndex)
                    return aIndex - bIndex;
                return ((_c = a.playedAt) !== null && _c !== void 0 ? _c : "").localeCompare((_d = b.playedAt) !== null && _d !== void 0 ? _d : "");
            }),
        };
    }
    else {
        const rr = buildRoundRobinStandings(matches, teamPlayers, teamNames);
        summary = { standings: rr.standings, isComplete: rr.isComplete };
    }
    return {
        tournamentId,
        gameId: (_b = (_a = matches[0]) === null || _a === void 0 ? void 0 : _a.gameId) !== null && _b !== void 0 ? _b : "",
        gameName: (_d = (_c = matches[0]) === null || _c === void 0 ? void 0 : _c.gameName) !== null && _d !== void 0 ? _d : "Unbekannt",
        system,
        location,
        matchCount,
        isComplete: summary.isComplete,
        standings: summary.standings,
        groupStandings: summary.groupStandings,
        knockoutMatches: summary.knockoutMatches,
        matches,
    };
}
function buildOverallStandings(matches, teamPlayers, teamNames, gameSummaries) {
    const { stats, isComplete } = computeTeamStats(matches, teamPlayers, teamNames);
    const pointsByTeam = {};
    const overallIsCertain = isComplete && (!gameSummaries || gameSummaries.every((game) => game.isComplete));
    if (gameSummaries) {
        for (const game of gameSummaries) {
            for (const standing of game.standings) {
                pointsByTeam[standing.teamId] = (pointsByTeam[standing.teamId] || 0) + standing.points;
            }
        }
    }
    else {
        const totalTeams = stats.length;
        const ranked = deterministicSortTeamStats(stats).map((entry, index) => (Object.assign(Object.assign({}, entry), { rank: index + 1 })));
        for (const entry of ranked) {
            pointsByTeam[entry.teamId] = calculatePlacementPoints(entry.rank, totalTeams);
        }
    }
    const placementTotals = {};
    const placementCounts = {};
    for (const game of gameSummaries || []) {
        for (const standing of game.standings) {
            placementTotals[standing.teamId] = (placementTotals[standing.teamId] || 0) + standing.rank;
            placementCounts[standing.teamId] = (placementCounts[standing.teamId] || 0) + 1;
        }
    }
    const sorted = [...stats].sort((a, b) => {
        const aPoints = pointsByTeam[a.teamId] || 0;
        const bPoints = pointsByTeam[b.teamId] || 0;
        if (bPoints !== aPoints)
            return bPoints - aPoints;
        if (b.wins !== a.wins)
            return b.wins - a.wins;
        const aAveragePlacement = placementCounts[a.teamId]
            ? placementTotals[a.teamId] / placementCounts[a.teamId]
            : Number.MAX_SAFE_INTEGER;
        const bAveragePlacement = placementCounts[b.teamId]
            ? placementTotals[b.teamId] / placementCounts[b.teamId]
            : Number.MAX_SAFE_INTEGER;
        if (aAveragePlacement !== bAveragePlacement)
            return aAveragePlacement - bAveragePlacement;
        const headToHead = (b.headToHead[a.teamId] || 0) - (a.headToHead[b.teamId] || 0);
        if (headToHead !== 0)
            return headToHead;
        const nameCompare = a.teamName.localeCompare(b.teamName);
        if (nameCompare !== 0)
            return nameCompare;
        return a.teamId.localeCompare(b.teamId);
    });
    return sorted.map((entry, index) => (Object.assign(Object.assign({}, entry), { rank: index + 1, points: pointsByTeam[entry.teamId] || 0, isCertain: overallIsCertain })));
}
function buildSeasonGameSummaries(tournaments, teamPlayers, teamNames) {
    return tournaments.flatMap((tournament) => {
        const matchesByGame = new Map();
        for (const match of tournament.matches.map((match) => normalizeMatch(match))) {
            const gameMatches = matchesByGame.get(match.gameId) || [];
            gameMatches.push(match);
            matchesByGame.set(match.gameId, gameMatches);
        }
        return Array.from(matchesByGame.values()).map((matches) => buildSeasonGameSummary(tournament.id, tournament.system, tournament.location, matches, teamPlayers, teamNames));
    });
}
function buildSeasonOverallDebug(overallStandings, games) {
    return overallStandings.map((standing) => ({
        team: standing.teamName,
        games: games
            .map((game) => {
            const gameStanding = game.standings.find((entry) => entry.teamId === standing.teamId);
            return gameStanding
                ? { game: game.gameName, placement: gameStanding.rank, awardedPoints: gameStanding.points }
                : null;
        })
            .filter((game) => game !== null),
        totalPoints: standing.points,
    }));
}
function buildSeasonSummary(season) {
    var _a, _b;
    const teamPlayers = buildTeamPlayers(season.teams);
    const teamNames = buildTeamNames(season.teams);
    const normalizedMatches = season.tournaments.flatMap((tournament) => tournament.matches.map((match) => normalizeMatch(match)));
    const gameSummaries = buildSeasonGameSummaries(season.tournaments, teamPlayers, teamNames)
        .filter((summary) => summary.matchCount > 0);
    const overallStandings = buildOverallStandings(normalizedMatches, teamPlayers, teamNames, gameSummaries);
    const champion = ((_a = overallStandings[0]) === null || _a === void 0 ? void 0 : _a.rank) === 1 && ((_b = overallStandings[0]) === null || _b === void 0 ? void 0 : _b.isCertain)
        ? { teamId: overallStandings[0].teamId, teamName: overallStandings[0].teamName, players: overallStandings[0].players }
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
        gameCount: new Set(normalizedMatches.map((match) => match.gameId)).size,
        matchCount: normalizedMatches.length,
        champion,
        isComplete: gameSummaries.every((game) => game.isComplete),
    };
}
function buildSeasonDetail(season) {
    var _a, _b;
    const teamPlayers = buildTeamPlayers(season.teams);
    const teamNames = buildTeamNames(season.teams);
    const normalizedMatches = season.tournaments.flatMap((tournament) => tournament.matches.map((match) => normalizeMatch(match)));
    const games = buildSeasonGameSummaries(season.tournaments, teamPlayers, teamNames)
        .filter((summary) => summary.matchCount > 0);
    const overallStandings = buildOverallStandings(normalizedMatches, teamPlayers, teamNames, games);
    const champion = ((_a = overallStandings[0]) === null || _a === void 0 ? void 0 : _a.rank) === 1 && ((_b = overallStandings[0]) === null || _b === void 0 ? void 0 : _b.isCertain)
        ? { teamId: overallStandings[0].teamId, teamName: overallStandings[0].teamName, players: overallStandings[0].players }
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
        gameCount: new Set(normalizedMatches.map((match) => match.gameId)).size,
        matchCount: normalizedMatches.length,
        champion,
        isComplete: games.every((game) => game.isComplete),
        overallStandings,
        overallDebug: buildSeasonOverallDebug(overallStandings, games),
        games,
        matches: normalizedMatches,
    };
}
function buildPlayerStatsSummaries(seasons, gameId) {
    var _a, _b, _c;
    const playerMap = {};
    for (const seasonRecord of seasons) {
        const { summary, detail, teamMembers } = seasonRecord;
        const teamIds = Object.keys(teamMembers);
        const teamIdToPlayers = teamMembers;
        const matchedGames = gameId ? detail.games.filter((game) => game.gameId === gameId) : detail.games;
        const matchFilter = (match) => !gameId || match.gameId === gameId;
        const teamGamePlacements = {};
        for (const game of matchedGames) {
            for (const teamStanding of game.standings) {
                teamGamePlacements[teamStanding.teamId] = teamGamePlacements[teamStanding.teamId] || [];
                teamGamePlacements[teamStanding.teamId].push(teamStanding.rank);
            }
        }
        for (const teamId of teamIds) {
            const playerIds = teamMembers[teamId];
            const teamStanding = detail.overallStandings.find((standing) => standing.teamId === teamId);
            const teamName = (_b = (_a = detail.overallStandings.find((standing) => standing.teamId === teamId)) === null || _a === void 0 ? void 0 : _a.teamName) !== null && _b !== void 0 ? _b : "";
            const seasonPlacement = teamStanding ? teamStanding.rank : 0;
            const seasonPoints = teamStanding ? teamStanding.points : 0;
            const isChampion = (teamStanding === null || teamStanding === void 0 ? void 0 : teamStanding.rank) === 1 && detail.isComplete;
            for (const playerId of playerIds) {
                const playerName = playerId;
                const existing = playerMap[playerId] || {
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
                existing.seasons += 1;
                if (isChampion)
                    existing.wonSeasons += 1;
                if (seasonPlacement > 0 && seasonPlacement <= 3 && detail.isComplete)
                    existing.podiums += 1;
                if (seasonPlacement > 0) {
                    existing.placements.push(seasonPlacement);
                    existing.bestPlacement = Math.min(existing.bestPlacement, seasonPlacement);
                    existing.worstPlacement = Math.max(existing.worstPlacement, seasonPlacement);
                }
                existing.totalPlacementPoints += seasonPoints;
                existing.teamNamesSet.add(teamName);
                const gamePlacements = (_c = teamGamePlacements[teamId]) !== null && _c !== void 0 ? _c : [];
                existing.gamePlacements.push(...gamePlacements);
                const matchesForTeam = detail.matches.filter((match) => matchFilter(match) && (match.team1Id === teamId || match.team2Id === teamId));
                for (const match of matchesForTeam) {
                    if (!match.winnerId)
                        continue;
                    existing.matchCount += 1;
                    if (match.winnerId === teamId)
                        existing.wins += 1;
                    else
                        existing.losses += 1;
                }
                playerMap[playerId] = existing;
            }
        }
    }
    return Object.values(playerMap).map((entry) => {
        const seasons = entry.seasons;
        const placements = entry.placements;
        const gamePlacements = entry.gamePlacements;
        const totalMatches = entry.matchCount;
        const winLossTotal = entry.wins + entry.losses;
        return {
            playerId: entry.playerId,
            playerName: entry.playerName,
            seasons,
            wonSeasons: entry.wonSeasons,
            podiums: entry.podiums,
            averagePlacement: seasons > 0 ? placements.reduce((sum, value) => sum + value, 0) / seasons : 0,
            bestPlacement: entry.bestPlacement === Number.MAX_SAFE_INTEGER ? 0 : entry.bestPlacement,
            worstPlacement: entry.worstPlacement,
            averageGamePlacement: gamePlacements.length > 0 ? gamePlacements.reduce((sum, value) => sum + value, 0) / gamePlacements.length : 0,
            matchCount: totalMatches,
            wins: entry.wins,
            losses: entry.losses,
            winRate: winLossTotal > 0 ? entry.wins / winLossTotal : 0,
            totalPlacementPoints: entry.totalPlacementPoints,
            averagePlacementPoints: seasons > 0 ? entry.totalPlacementPoints / seasons : 0,
            teamNames: Array.from(entry.teamNamesSet).sort(),
        };
    });
}
function buildPlayerStatsDetail(playerId, seasons, gameId) {
    var _a, _b, _c;
    let stats = null;
    for (const { summary, detail, teamMembers, teamNames } of seasons) {
        const playerTeamEntries = Object.entries(teamMembers).filter(([_, players]) => players.includes(playerId));
        if (playerTeamEntries.length === 0)
            continue;
        const teamId = playerTeamEntries[0][0];
        const teammates = playerTeamEntries[0][1].filter((id) => id !== playerId).map((id) => id);
        const teamName = (_a = teamNames[teamId]) !== null && _a !== void 0 ? _a : "";
        const seasonStanding = detail.overallStandings.find((standing) => standing.teamId === teamId);
        const placement = (_b = seasonStanding === null || seasonStanding === void 0 ? void 0 : seasonStanding.rank) !== null && _b !== void 0 ? _b : 0;
        const points = (_c = seasonStanding === null || seasonStanding === void 0 ? void 0 : seasonStanding.points) !== null && _c !== void 0 ? _c : 0;
        const isChampion = placement === 1 && detail.isComplete;
        const games = detail.games
            .filter((game) => !gameId || game.gameId === gameId)
            .filter((game) => game.standings.some((entry) => entry.teamId === teamId))
            .map((game) => {
            const entry = game.standings.find((row) => row.teamId === teamId);
            const gameMatches = game.matches.filter((match) => match.team1Id === teamId || match.team2Id === teamId);
            const wins = gameMatches.filter((match) => match.winnerId === teamId).length;
            const losses = gameMatches.filter((match) => match.winnerId && match.winnerId !== teamId).length;
            return {
                gameId: game.gameId,
                gameName: game.gameName,
                system: game.system,
                placement: entry.rank,
                points: entry.points,
                wins,
                losses,
            };
        });
        const relevantMatches = detail.matches.filter((match) => (!gameId || match.gameId === gameId) && (match.team1Id === teamId || match.team2Id === teamId));
        const matchCount = relevantMatches.filter((m) => m.winnerId).length;
        const wins = relevantMatches.filter((m) => m.winnerId === teamId).length;
        const losses = relevantMatches.filter((m) => m.winnerId && m.winnerId !== teamId).length;
        const winRate = matchCount > 0 ? wins / matchCount : 0;
        const placementPoints = points;
        const playerName = teamMembers[teamId].includes(playerId) ? playerId : playerId;
        if (!stats) {
            stats = {
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
                seasonsDetail: [],
                matches: [],
            };
        }
        stats.seasons += 1;
        if (isChampion)
            stats.wonSeasons += 1;
        if (placement > 0 && placement <= 3 && detail.isComplete)
            stats.podiums += 1;
        stats.bestPlacement = Math.min(stats.bestPlacement, placement || Number.MAX_SAFE_INTEGER);
        stats.worstPlacement = Math.max(stats.worstPlacement, placement);
        stats.totalPlacementPoints += placementPoints;
        stats.matchCount += matchCount;
        stats.wins += wins;
        stats.losses += losses;
        stats.teamNames = Array.from(new Set([...stats.teamNames, teamName])).sort();
        stats.seasonsDetail.push({
            seasonId: summary.id,
            seasonName: summary.name,
            seasonYear: summary.year,
            teamName,
            teammates,
            placement,
            points: placementPoints,
            isChampion,
            games,
        });
        for (const match of relevantMatches) {
            const opponentId = match.team1Id === teamId ? match.team2Id : match.team1Id;
            const opponentName = match.team1Id === teamId ? match.team2Name : match.team1Name;
            stats.matches.push({
                id: match.id,
                seasonId: summary.id,
                seasonName: summary.name,
                gameId: match.gameId,
                gameName: match.gameName,
                stage: match.stage,
                groupName: match.groupName,
                teamName,
                opponentName,
                result: match.winnerId ? (match.winnerId === teamId ? "Sieg" : "Niederlage") : "offen",
                winnerId: match.winnerId,
                playedAt: match.playedAt,
                scheduledAt: match.scheduledAt,
                comment: match.comment,
            });
        }
    }
    if (!stats)
        return null;
    const seasonCount = stats.seasons;
    const totalGamePlacements = stats.seasonsDetail.flatMap((s) => s.games.map((g) => g.placement));
    stats.averagePlacement = seasonCount > 0 ? stats.seasonsDetail.reduce((sum, s) => sum + s.placement, 0) / seasonCount : 0;
    stats.averageGamePlacement = totalGamePlacements.length > 0 ? totalGamePlacements.reduce((sum, n) => sum + n, 0) / totalGamePlacements.length : 0;
    stats.winRate = stats.matchCount > 0 ? stats.wins / stats.matchCount : 0;
    stats.bestPlacement = stats.bestPlacement === Number.MAX_SAFE_INTEGER ? 0 : stats.bestPlacement;
    stats.averagePlacementPoints = seasonCount > 0 ? stats.totalPlacementPoints / seasonCount : 0;
    return stats;
}
