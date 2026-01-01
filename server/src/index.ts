import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { wsHandler } from './services/WebSocketHandler.js';
import { matchmaking } from './services/MatchmakingService.js';
import { gameState } from './services/GameStateManager.js';

const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        connections: wsHandler.getConnectionCount(),
        queueSize: matchmaking.getQueueSize(),
        activeGames: matchmaking.getActiveGamesCount(),
        timestamp: new Date().toISOString(),
    });
});

const server = createServer(app);

wsHandler.initialize(server);

wsHandler.onMessage('join', (ws, msg) => {
    if (msg.username) {
        wsHandler.registerUser(ws, msg.username);
        wsHandler.send(ws, { type: 'joined', username: msg.username });
        console.log(`👤 User joined: ${msg.username}`);
    }
});

wsHandler.onMessage('findGame', (ws, msg) => {
    if (ws.username) {
        matchmaking.addToQueue(ws, ws.username);
    } else {
        wsHandler.send(ws, { type: 'error', message: 'Must join first' });
    }
});

wsHandler.onMessage('cancelQueue', (ws, msg) => {
    if (ws.username) {
        matchmaking.cancelQueue(ws.username);
    }
});

wsHandler.onMessage('move', (ws, msg) => {
    if (ws.username && msg.column !== undefined) {
        gameState.handleMove(ws.username, msg.column);
    }
});

wsHandler.onMessage('_disconnect', (ws, msg) => {
    if (ws.username) {
        matchmaking.removeFromQueue(ws.username);
        gameState.handleForfeit(ws.username);
    }
});

server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║        🎮 Four in a Row Server Started! 🎮            ║
╠═══════════════════════════════════════════════════════╣
║  HTTP:      http://localhost:${PORT}                    ║
║  WebSocket: ws://localhost:${PORT}                      ║
╚═══════════════════════════════════════════════════════╝
    `);
});

process.on('SIGINT', () => {
    console.log('\nShutting down...');
    wsHandler.shutdown();
    process.exit(0);
});
