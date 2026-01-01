import { Router } from 'express';
import { db } from '../database/db.js';
import { wsHandler } from '../services/WebSocketHandler.js';
import { matchmaking } from '../services/MatchmakingService.js';

const router = Router();

router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        connections: wsHandler.getConnectionCount(),
        queueSize: matchmaking.getQueueSize(),
        activeGames: matchmaking.getActiveGamesCount(),
        timestamp: new Date().toISOString(),
    });
});

router.get('/api/leaderboard', async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await db.getLeaderboard(limit);
    res.json(leaderboard);
});

router.get('/api/players/:username/stats', async (req, res) => {
    const stats = await db.getPlayerStats(req.params.username);
    if (!stats) {
        res.status(404).json({ error: 'Player not found' });
        return;
    }
    res.json(stats);
});

router.get('/api/games/recent', async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const games = await db.getRecentGames(limit);
    res.json(games);
});

export default router;
