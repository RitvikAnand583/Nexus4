CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY,
    player1_username VARCHAR(50) NOT NULL,
    player2_username VARCHAR(50) NOT NULL,
    winner_username VARCHAR(50),
    is_bot_game BOOLEAN DEFAULT FALSE,
    moves JSONB NOT NULL,
    result VARCHAR(10) CHECK (result IN ('win', 'draw', 'forfeit')),
    duration_seconds INTEGER,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_stats (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    total_games INTEGER DEFAULT 0,
    total_moves INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    bot_games INTEGER DEFAULT 0,
    pvp_games INTEGER DEFAULT 0,
    avg_duration_seconds INTEGER DEFAULT 0,
    avg_moves_per_game INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hourly_activity (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    games_count INTEGER DEFAULT 0,
    UNIQUE(date, hour)
);

CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_players_wins ON players(wins DESC);
CREATE INDEX IF NOT EXISTS idx_games_ended_at ON games(ended_at);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_hourly_activity_date ON hourly_activity(date, hour);
