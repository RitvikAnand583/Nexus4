import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { wsHandler } from './services/WebSocketHandler.js';
import { matchmaking } from './services/MatchmakingService.js';
import { gameState } from './services/GameStateManager.js';
import { db } from './database/db.js';
import routes from './routes/routes.js';

const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);

const server = createServer(app);

wsHandler.initialize(server);

wsHandler.onMessage('join', (ws, msg) => {
    if (msg.username) {
        wsHandler.registerUser(ws, msg.username);
        db.upsertPlayer(msg.username);
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

wsHandler.onMessage('rejoin', (ws, msg) => {
    if (msg.username) {
        if (gameState.handleReconnect(ws, msg.username)) {
            console.log(`🔄 ${msg.username} rejoined game`);
        } else {
            wsHandler.registerUser(ws, msg.username);
            wsHandler.send(ws, { type: 'joined', username: msg.username });
        }
    }
});

wsHandler.onMessage('_disconnect', (ws, msg) => {
    if (ws.username) {
        matchmaking.removeFromQueue(ws.username);
        gameState.handleDisconnect(ws.username);
    }
});

async function start() {
    await db.connect();

    server.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════╗
║        🎮 Nexus4 Server Started! 🎮                   ║
╠═══════════════════════════════════════════════════════╣
║  HTTP:      http://localhost:${PORT}                  ║
║  WebSocket: ws://localhost:${PORT}                    ║
╚═══════════════════════════════════════════════════════╝
        `);
    });
}

process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    wsHandler.shutdown();
    await db.disconnect();
    process.exit(0);
});

start().catch(console.error);
