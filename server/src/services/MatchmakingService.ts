import { v4 as uuidv4 } from 'uuid';
import { wsHandler, GameWebSocket } from './WebSocketHandler.js';
import { createEmptyBoard, Board, Player } from '../game/GameLogic.js';
import { kafkaProducer } from '../kafka/producer.js';

const MATCHMAKING_TIMEOUT = 10000;

interface QueuedPlayer {
    username: string;
    ws: GameWebSocket;
    queuedAt: number;
    timeoutId: NodeJS.Timeout;
}

interface ActiveGame {
    id: string;
    board: Board;
    player1: string;
    player2: string;
    currentPlayer: Player;
    isPlayer2Bot: boolean;
    startedAt: Date;
    moves: { player: string; column: number; timestamp: number }[];
}

class MatchmakingService {
    private queue: Map<string, QueuedPlayer> = new Map();
    private games: Map<string, ActiveGame> = new Map();
    private playerGames: Map<string, string> = new Map();

    addToQueue(ws: GameWebSocket, username: string): void {
        if (this.queue.has(username)) {
            wsHandler.send(ws, { type: 'error', message: 'Already in queue' });
            return;
        }

        if (this.playerGames.has(username)) {
            wsHandler.send(ws, { type: 'error', message: 'Already in a game' });
            return;
        }
        const waitingPlayer = this.findWaitingPlayer(username);

        if (waitingPlayer) {
            this.removeFromQueue(waitingPlayer.username);
            this.startGame(waitingPlayer.username, username, false);
        } else {
            const timeoutId = setTimeout(() => {
                this.matchWithBot(username);
            }, MATCHMAKING_TIMEOUT);

            this.queue.set(username, {
                username,
                ws,
                queuedAt: Date.now(),
                timeoutId,
            });

            wsHandler.send(ws, { type: 'queued', message: 'Searching for opponent...' });
            console.log(`🔍 ${username} added to queue (${this.queue.size} in queue)`);
        }
    }

    removeFromQueue(username: string): boolean {
        const player = this.queue.get(username);
        if (player) {
            clearTimeout(player.timeoutId);
            this.queue.delete(username);
            console.log(`❌ ${username} removed from queue`);
            return true;
        }
        return false;
    }

    cancelQueue(username: string): void {
        if (this.removeFromQueue(username)) {
            wsHandler.sendToUser(username, { type: 'queueCancelled' });
        }
    }

    private findWaitingPlayer(excludeUsername: string): QueuedPlayer | null {
        for (const [username, player] of this.queue) {
            if (username !== excludeUsername) {
                return player;
            }
        }
        return null;
    }

    private matchWithBot(username: string): void {
        const player = this.queue.get(username);
        if (!player) return;

        this.removeFromQueue(username);
        this.startGame(username, 'Bot', true);
        console.log(`🤖 ${username} matched with Bot (timeout)`);
    }

    startGame(player1: string, player2: string, isPlayer2Bot: boolean): string {
        const gameId = uuidv4();
        const game: ActiveGame = {
            id: gameId,
            board: createEmptyBoard(),
            player1,
            player2,
            currentPlayer: 1,
            isPlayer2Bot,
            startedAt: new Date(),
            moves: [],
        };

        this.games.set(gameId, game);
        this.playerGames.set(player1, gameId);
        if (!isPlayer2Bot) {
            this.playerGames.set(player2, gameId);
        }

        const gameStartMsg = (yourPlayer: Player, opponent: string) => ({
            type: 'gameStart',
            gameId,
            board: game.board,
            currentPlayer: game.currentPlayer,
            yourPlayer,
            opponent,
            isOpponentBot: yourPlayer === 1 ? isPlayer2Bot : false,
        });

        wsHandler.sendToUser(player1, gameStartMsg(1, player2));
        if (!isPlayer2Bot) {
            wsHandler.sendToUser(player2, gameStartMsg(2, player1));
        }

        kafkaProducer.gameStarted(gameId, player1, player2, isPlayer2Bot);

        console.log(`🎮 Game started: ${player1} vs ${player2} (${gameId})`);
        return gameId;
    }

    getGame(gameId: string): ActiveGame | undefined {
        return this.games.get(gameId);
    }

    getGameByPlayer(username: string): ActiveGame | undefined {
        const gameId = this.playerGames.get(username);
        return gameId ? this.games.get(gameId) : undefined;
    }


    endGame(gameId: string): void {
        const game = this.games.get(gameId);
        if (game) {
            this.playerGames.delete(game.player1);
            if (!game.isPlayer2Bot) {
                this.playerGames.delete(game.player2);
            }
            this.games.delete(gameId);
            console.log(`🏁 Game ended: ${gameId}`);
        }
    }


    getQueueSize(): number {
        return this.queue.size;
    }


    getActiveGamesCount(): number {
        return this.games.size;
    }
}

export const matchmaking = new MatchmakingService();
export type { ActiveGame };
