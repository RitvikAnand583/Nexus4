# Nxus - Real-Time Multiplayer Game

A real-time multiplayer Connect Four game with competitive AI bot, WebSocket communication, and Kafka analytics.

## 🎮 Features

- **Real-time Multiplayer**: Play against other players via WebSocket
- **Competitive AI Bot**: Minimax with alpha-beta pruning (joins after 10s if no opponent)
- **🎤 Voice Chat**: WebRTC-based voice communication with opponent
- **Reconnection Support**: Rejoin games within 30 seconds if disconnected
- **Leaderboard**: Track wins, losses, and rankings
- **Analytics**: Kafka-powered game metrics tracking

## 🎤 Voice Chat

During games against human players, you can initiate voice chat:

1. Click the **🎤 Voice** button
2. Your opponent sees an accept/decline popup (15 second timer)
3. If accepted, both players grant microphone access
4. Voice connected! Mute/unmute anytime during the game

**Note:** Voice chat uses WebRTC with STUN servers for peer-to-peer audio.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for PostgreSQL & Kafka)

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL and Kafka.

### 2. Start the Backend

```bash
cd server
npm install
npm run dev
```

Server runs at `http://localhost:3001`

### 3. Start the Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### 4. (Optional) Start Analytics Consumer

```bash
cd analytics
npm install
npm run dev
```

## 🎯 How to Play

1. Open `http://localhost:5173` in your browser
2. Enter a username and click "Join Game"
3. Click "Find Game" to enter matchmaking
4. If no opponent joins in 10 seconds, you'll play against our AI bot
5. Click a column to drop your disc
6. Connect 4 discs horizontally, vertically, or diagonally to win!

## 📁 Project Structure

```
four-in-row/
├── server/           # Node.js backend
│   ├── src/
│   │   ├── game/     # Game logic & Bot AI
│   │   ├── services/ # WebSocket, matchmaking, state
│   │   ├── database/ # PostgreSQL integration
│   │   └── kafka/    # Event publishing
│   └── package.json
├── client/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── styles/
│   └── package.json
├── analytics/        # Kafka consumer
│   └── src/
└── docker-compose.yml
```

## 🔧 API Endpoints

- `GET /health` - Health check
- `GET /api/leaderboard` - Get top players
- `GET /api/players/:username/stats` - Get player stats
- `GET /api/games/recent` - Get recent games

## 🎮 WebSocket Messages

### Client → Server
- `join` - Join with username
- `rejoin` - Rejoin existing game
- `findGame` - Enter matchmaking queue
- `cancelQueue` - Leave matchmaking queue
- `move` - Make a move (column number)
- `voice_request` - Request voice chat
- `voice_accept` - Accept voice chat
- `voice_decline` - Decline voice chat
- `rtc_offer` / `rtc_answer` / `rtc_ice_candidate` - WebRTC signaling

### Server → Client
- `joined` - Successfully joined
- `queued` - In matchmaking queue
- `gameStart` - Game started
- `move` - Move made (by you or opponent)
- `gameOver` - Game ended
- `opponentDisconnected` - Opponent disconnected
- `opponentReconnected` - Opponent returned
- `voice_request` / `voice_accept` / `voice_decline` - Voice chat signals
