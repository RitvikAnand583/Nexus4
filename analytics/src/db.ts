import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nexus4';

const pool = new Pool({
    connectionString: DATABASE_URL,
});

class AnalyticsDB {
    private connected: boolean = false;

    async connect(): Promise<void> {
        try {
            await pool.query('SELECT 1');
            this.connected = true;
            console.log('✅ Analytics DB connected');
        } catch (error) {
            console.warn('⚠️ Database not available, stats will not be persisted');
            this.connected = false;
        }
    }

    async disconnect(): Promise<void> {
        await pool.end();
        this.connected = false;
    }

    async incrementDailyStats(
        date: Date,
        moves: number,
        duration: number,
        isBotGame: boolean
    ): Promise<void> {
        if (!this.connected) return;

        const dateStr = date.toISOString().split('T')[0];

        try {
            await pool.query(
                `INSERT INTO daily_stats (date, total_games, total_moves, total_duration_seconds, bot_games, pvp_games)
                 VALUES ($1, 1, $2, $3, $4, $5)
                 ON CONFLICT (date) DO UPDATE SET
                     total_games = daily_stats.total_games + 1,
                     total_moves = daily_stats.total_moves + $2,
                     total_duration_seconds = daily_stats.total_duration_seconds + $3,
                     bot_games = daily_stats.bot_games + $4,
                     pvp_games = daily_stats.pvp_games + $5,
                     avg_duration_seconds = (daily_stats.total_duration_seconds + $3) / (daily_stats.total_games + 1),
                     avg_moves_per_game = (daily_stats.total_moves + $2) / (daily_stats.total_games + 1),
                     updated_at = CURRENT_TIMESTAMP`,
                [dateStr, moves, duration, isBotGame ? 1 : 0, isBotGame ? 0 : 1]
            );
        } catch (error) {
            console.error('Failed to update daily stats:', error);
        }
    }

    async incrementHourlyActivity(date: Date): Promise<void> {
        if (!this.connected) return;

        const dateStr = date.toISOString().split('T')[0];
        const hour = date.getHours();

        try {
            await pool.query(
                `INSERT INTO hourly_activity (date, hour, games_count)
                 VALUES ($1, $2, 1)
                 ON CONFLICT (date, hour) DO UPDATE SET
                     games_count = hourly_activity.games_count + 1`,
                [dateStr, hour]
            );
        } catch (error) {
            console.error('Failed to update hourly activity:', error);
        }
    }

    async getDailyStats(days: number = 7): Promise<any[]> {
        if (!this.connected) return [];

        try {
            const result = await pool.query(
                `SELECT * FROM daily_stats
                 WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
                 ORDER BY date DESC`
            );
            return result.rows;
        } catch (error) {
            console.error('Failed to get daily stats:', error);
            return [];
        }
    }

    async getHourlyActivity(date: string): Promise<any[]> {
        if (!this.connected) return [];

        try {
            const result = await pool.query(
                `SELECT * FROM hourly_activity
                 WHERE date = $1
                 ORDER BY hour`,
                [date]
            );
            return result.rows;
        } catch (error) {
            console.error('Failed to get hourly activity:', error);
            return [];
        }
    }

    async getTotalStats(): Promise<any> {
        if (!this.connected) return null;

        try {
            const result = await pool.query(
                `SELECT 
                    SUM(total_games) as total_games,
                    SUM(total_moves) as total_moves,
                    AVG(avg_duration_seconds) as avg_duration,
                    SUM(bot_games) as bot_games,
                    SUM(pvp_games) as pvp_games
                 FROM daily_stats`
            );
            return result.rows[0];
        } catch (error) {
            console.error('Failed to get total stats:', error);
            return null;
        }
    }
}

export const analyticsDB = new AnalyticsDB();
