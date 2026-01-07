import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'Nxus',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

export interface GameRecord {
    id: string;
    player1Username: string;
    player2Username: string;
    winnerUsername: string | null;
    isBotGame: boolean;
    moves: any[];
    result: 'win' | 'draw' | 'forfeit';
    durationSeconds: number;
    startedAt: Date;
}

export interface PlayerStats {
    username: string;
    wins: number;
    losses: number;
    draws: number;
}

export interface LeaderboardEntry {
    rank: number;
    username: string;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
}

class DatabaseService {
    private connected: boolean = false;

    async connect(): Promise<void> {
        try {
            const client = await pool.connect();
            client.release();
            this.connected = true;
            console.log('✅ PostgreSQL connected');
        } catch (error) {
            console.warn('⚠️ PostgreSQL not available, data will not be persisted');
            this.connected = false;
        }
    }

    async disconnect(): Promise<void> {
        await pool.end();
    }

    async upsertPlayer(username: string): Promise<void> {
        if (!this.connected) return;

        try {
            await pool.query(
                `INSERT INTO players (username) VALUES ($1) 
                 ON CONFLICT (username) DO NOTHING`,
                [username]
            );
        } catch (error) {
            console.error('Failed to upsert player:', error);
        }
    }

    async saveGame(game: GameRecord): Promise<void> {
        if (!this.connected) return;

        try {
            await pool.query(
                `INSERT INTO games (
                    id, player1_username, player2_username, winner_username,
                    is_bot_game, moves, result, duration_seconds, started_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    game.id,
                    game.player1Username,
                    game.player2Username,
                    game.winnerUsername,
                    game.isBotGame,
                    JSON.stringify(game.moves),
                    game.result,
                    game.durationSeconds,
                    game.startedAt,
                ]
            );
        } catch (error) {
            console.error('Failed to save game:', error);
        }
    }

    async updatePlayerStats(username: string, result: 'win' | 'loss' | 'draw'): Promise<void> {
        if (!this.connected) return;

        try {
            const column = result === 'win' ? 'wins' : result === 'loss' ? 'losses' : 'draws';
            await pool.query(
                `UPDATE players SET ${column} = ${column} + 1, updated_at = CURRENT_TIMESTAMP
                 WHERE username = $1`,
                [username]
            );
        } catch (error) {
            console.error('Failed to update player stats:', error);
        }
    }

    async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
        if (!this.connected) return [];

        try {
            const result = await pool.query(
                `SELECT 
                    username, wins, losses, draws,
                    CASE WHEN (wins + losses + draws) > 0 
                        THEN ROUND((wins::numeric / (wins + losses + draws) * 100), 1)
                        ELSE 0 
                    END as win_rate
                 FROM players 
                 WHERE wins + losses + draws > 0
                 ORDER BY wins DESC, win_rate DESC
                 LIMIT $1`,
                [limit]
            );

            return result.rows.map((row, index) => ({
                rank: index + 1,
                username: row.username,
                wins: row.wins,
                losses: row.losses,
                draws: row.draws,
                winRate: parseFloat(row.win_rate),
            }));
        } catch (error) {
            console.error('Failed to get leaderboard:', error);
            return [];
        }
    }

    async getPlayerStats(username: string): Promise<PlayerStats | null> {
        if (!this.connected) return null;

        try {
            const result = await pool.query(
                'SELECT username, wins, losses, draws FROM players WHERE username = $1',
                [username]
            );

            if (result.rows.length === 0) return null;

            return {
                username: result.rows[0].username,
                wins: result.rows[0].wins,
                losses: result.rows[0].losses,
                draws: result.rows[0].draws,
            };
        } catch (error) {
            console.error('Failed to get player stats:', error);
            return null;
        }
    }

    async getRecentGames(limit: number = 10): Promise<any[]> {
        if (!this.connected) return [];

        try {
            const result = await pool.query(
                `SELECT id, player1_username, player2_username, winner_username,
                        is_bot_game, result, duration_seconds, ended_at
                 FROM games ORDER BY ended_at DESC LIMIT $1`,
                [limit]
            );

            return result.rows.map(row => ({
                id: row.id,
                player1: row.player1_username,
                player2: row.player2_username,
                winner: row.winner_username,
                isBotGame: row.is_bot_game,
                result: row.result,
                duration: row.duration_seconds,
                endedAt: row.ended_at,
            }));
        } catch (error) {
            console.error('Failed to get recent games:', error);
            return [];
        }
    }
}

export const db = new DatabaseService();
