import { wsHandler, GameWebSocket } from './WebSocketHandler.js';
import { matchmaking, ActiveGame } from './MatchmakingService.js';
import { dropDisc, checkWinner, isBoardFull, getWinningCells, Player } from '../game/GameLogic.js';
import { getBotMove } from '../game/BotAI.js';
import { db } from '../database/db.js';

const BOT_MOVE_DELAY = 800;
const RECONNECT_TIMEOUT = 30000;

interface DisconnectedPlayer {
    username: string;
    gameId: string;
    timeoutId: NodeJS.Timeout;
    disconnectedAt: number;
}

class GameStateManager {
    private disconnectedPlayers: Map<string, DisconnectedPlayer> = new Map();

    handleMove(username: string, column: number): void {
        const game = matchmaking.getGameByPlayer(username);
        if (!game) {
            wsHandler.sendToUser(username, { type: 'error', message: 'Not in a game' });
            return;
        }

        const playerNumber = this.getPlayerNumber(game, username);
        if (!playerNumber) {
            wsHandler.sendToUser(username, { type: 'error', message: 'Not your game' });
            return;
        }

        if (game.currentPlayer !== playerNumber) {
            wsHandler.sendToUser(username, { type: 'error', message: 'Not your turn' });
            return;
        }

        const row = dropDisc(game.board, column, playerNumber);
        if (row === -1) {
            wsHandler.sendToUser(username, { type: 'error', message: 'Invalid move' });
            return;
        }

        game.moves.push({ player: username, column, timestamp: Date.now() });

        const winner = checkWinner(game.board, row, column);
        if (winner) {
            this.endGame(game, username, 'win', row, column);
            return;
        }

        if (isBoardFull(game.board)) {
            this.endGame(game, null, 'draw', row, column);
            return;
        }

        game.currentPlayer = game.currentPlayer === 1 ? 2 : 1;
        this.broadcastMove(game);

        if (game.isPlayer2Bot && game.currentPlayer === 2) {
            this.scheduleBotMove(game);
        }
    }

    handleDisconnect(username: string): void {
        const game = matchmaking.getGameByPlayer(username);
        if (!game || game.isPlayer2Bot) {
            this.handleForfeit(username);
            return;
        }

        const timeoutId = setTimeout(() => {
            this.handleReconnectTimeout(username);
        }, RECONNECT_TIMEOUT);

        this.disconnectedPlayers.set(username, {
            username,
            gameId: game.id,
            timeoutId,
            disconnectedAt: Date.now(),
        });

        const opponent = game.player1 === username ? game.player2 : game.player1;
        wsHandler.sendToUser(opponent, {
            type: 'opponentDisconnected',
            timeout: RECONNECT_TIMEOUT / 1000,
        });

        console.log(`⏳ ${username} disconnected, 30s to reconnect`);
    }

    handleReconnect(ws: GameWebSocket, username: string): boolean {
        const disconnected = this.disconnectedPlayers.get(username);
        if (!disconnected) return false;

        clearTimeout(disconnected.timeoutId);
        this.disconnectedPlayers.delete(username);

        const game = matchmaking.getGame(disconnected.gameId);
        if (!game) return false;

        wsHandler.registerUser(ws, username);

        const playerNumber = this.getPlayerNumber(game, username);
        wsHandler.send(ws, {
            type: 'reconnected',
            gameId: game.id,
            board: game.board,
            currentPlayer: game.currentPlayer,
            yourPlayer: playerNumber,
            opponent: playerNumber === 1 ? game.player2 : game.player1,
            isOpponentBot: game.isPlayer2Bot,
        });

        const opponent = game.player1 === username ? game.player2 : game.player1;
        wsHandler.sendToUser(opponent, { type: 'opponentReconnected' });

        console.log(`🔄 ${username} reconnected to game ${game.id}`);
        return true;
    }

    private handleReconnectTimeout(username: string): void {
        const disconnected = this.disconnectedPlayers.get(username);
        if (!disconnected) return;

        this.disconnectedPlayers.delete(username);

        const game = matchmaking.getGame(disconnected.gameId);
        if (!game) return;

        const winner = game.player1 === username ? game.player2 : game.player1;

        wsHandler.sendToUser(winner, {
            type: 'gameOver',
            board: game.board,
            winner,
            result: 'forfeit',
            winningCells: [],
            message: 'Opponent failed to reconnect',
        });

        matchmaking.endGame(game.id);
        console.log(`⌛ ${username} failed to reconnect - ${winner} wins`);
    }

    isDisconnected(username: string): boolean {
        return this.disconnectedPlayers.has(username);
    }

    private scheduleBotMove(game: ActiveGame): void {
        setTimeout(() => {
            const currentGame = matchmaking.getGame(game.id);
            if (!currentGame || currentGame.currentPlayer !== 2) return;

            const botCol = getBotMove(game.board, 2);
            if (botCol === -1) return;

            const row = dropDisc(game.board, botCol, 2);
            if (row === -1) return;

            game.moves.push({ player: 'Bot', column: botCol, timestamp: Date.now() });

            const winner = checkWinner(game.board, row, botCol);
            if (winner) {
                this.endGame(game, 'Bot', 'win', row, botCol);
                return;
            }

            if (isBoardFull(game.board)) {
                this.endGame(game, null, 'draw', row, botCol);
                return;
            }

            game.currentPlayer = 1;
            this.broadcastMove(game);
        }, BOT_MOVE_DELAY);
    }

    private broadcastMove(game: ActiveGame): void {
        const moveMsg = {
            type: 'move',
            board: game.board,
            currentPlayer: game.currentPlayer,
        };

        wsHandler.sendToUser(game.player1, moveMsg);
        if (!game.isPlayer2Bot) {
            wsHandler.sendToUser(game.player2, moveMsg);
        }
    }

    private endGame(game: ActiveGame, winner: string | null, result: 'win' | 'draw', lastRow: number, lastCol: number): void {
        const winningCells = winner ? getWinningCells(game.board, lastRow, lastCol) : [];
        const duration = Math.floor((Date.now() - game.startedAt.getTime()) / 1000);

        const gameOverMsg = {
            type: 'gameOver',
            board: game.board,
            winner,
            result,
            winningCells,
            duration,
        };

        wsHandler.sendToUser(game.player1, gameOverMsg);
        if (!game.isPlayer2Bot) {
            wsHandler.sendToUser(game.player2, gameOverMsg);
        }

        this.persistGame(game, winner, result, duration);

        this.disconnectedPlayers.delete(game.player1);
        this.disconnectedPlayers.delete(game.player2);

        matchmaking.endGame(game.id);
        console.log(`🏆 Game ${game.id}: ${winner || 'Draw'} (${result})`);
    }

    private getPlayerNumber(game: ActiveGame, username: string): Player | null {
        if (game.player1 === username) return 1;
        if (game.player2 === username) return 2;
        return null;
    }

    private async persistGame(game: ActiveGame, winner: string | null, result: 'win' | 'draw' | 'forfeit', duration: number): Promise<void> {
        await db.saveGame({
            id: game.id,
            player1Username: game.player1,
            player2Username: game.player2,
            winnerUsername: winner,
            isBotGame: game.isPlayer2Bot,
            moves: game.moves,
            result,
            durationSeconds: duration,
            startedAt: game.startedAt,
        });

        if (result === 'win' && winner) {
            const loser = winner === game.player1 ? game.player2 : game.player1;
            await db.updatePlayerStats(winner, 'win');
            if (!game.isPlayer2Bot || winner !== game.player2) {
                await db.updatePlayerStats(loser, 'loss');
            }
        } else if (result === 'draw') {
            await db.updatePlayerStats(game.player1, 'draw');
            if (!game.isPlayer2Bot) {
                await db.updatePlayerStats(game.player2, 'draw');
            }
        } else if (result === 'forfeit' && winner) {
            await db.updatePlayerStats(winner, 'win');
            const loser = winner === game.player1 ? game.player2 : game.player1;
            if (!game.isPlayer2Bot) {
                await db.updatePlayerStats(loser, 'loss');
            }
        }
    }

    handleForfeit(username: string): void {
        const game = matchmaking.getGameByPlayer(username);
        if (!game) return;

        const winner = game.player1 === username ? game.player2 : game.player1;
        const duration = Math.floor((Date.now() - game.startedAt.getTime()) / 1000);

        const gameOverMsg = {
            type: 'gameOver',
            board: game.board,
            winner: game.isPlayer2Bot ? null : winner,
            result: 'forfeit',
            winningCells: [],
        };

        if (!game.isPlayer2Bot) {
            wsHandler.sendToUser(winner, gameOverMsg);
        }

        this.persistGame(game, game.isPlayer2Bot ? null : winner, 'forfeit', duration);

        matchmaking.endGame(game.id);
        console.log(`🚪 Game ${game.id}: ${username} forfeited`);
    }
}

export const gameState = new GameStateManager();
