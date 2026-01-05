import { Kafka, Consumer, EachMessagePayload, logLevel } from 'kafkajs';

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const GROUP_ID = 'nexus4-analytics';
const TOPIC = 'game-events';

interface GameEvent {
    type: 'game_start' | 'move' | 'game_end' | 'player_disconnect' | 'player_reconnect';
    gameId: string;
    timestamp: number;
    data: Record<string, any>;
}

interface GameStats {
    totalGames: number;
    totalMoves: number;
    totalDuration: number;
    wins: Map<string, number>;
    gamesPerHour: Map<number, number>;
}

class AnalyticsConsumer {
    private kafka: Kafka;
    private consumer: Consumer;
    private stats: GameStats;
    private activeGames: Map<string, { startTime: number; moves: number }>;

    constructor() {
        this.kafka = new Kafka({
            clientId: 'nexus4-analytics',
            brokers: [KAFKA_BROKER],
            logLevel: logLevel.ERROR,
            retry: {
                initialRetryTime: 300,
                retries: 10,
            },
        });
        this.consumer = this.kafka.consumer({ groupId: GROUP_ID });
        this.stats = {
            totalGames: 0,
            totalMoves: 0,
            totalDuration: 0,
            wins: new Map(),
            gamesPerHour: new Map(),
        };
        this.activeGames = new Map();
    }

    async start(): Promise<void> {
        try {
            await this.consumer.connect();
            console.log('✅ Kafka consumer connected');

            await this.consumer.subscribe({ topic: TOPIC, fromBeginning: false });
            console.log(`📡 Subscribed to topic: ${TOPIC}`);

            await this.consumer.run({
                eachMessage: async (payload: EachMessagePayload) => {
                    await this.processMessage(payload);
                },
            });
        } catch (error) {
            console.error('❌ Failed to start consumer:', error);
            setTimeout(() => this.start(), 5000);
        }
    }

    private async processMessage({ message }: EachMessagePayload): Promise<void> {
        if (!message.value) return;

        try {
            const event: GameEvent = JSON.parse(message.value.toString());
            await this.handleEvent(event);
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    }

    private async handleEvent(event: GameEvent): Promise<void> {
        const timestamp = new Date(event.timestamp);
        const hour = timestamp.getHours();

        switch (event.type) {
            case 'game_start':
                this.stats.totalGames++;
                this.activeGames.set(event.gameId, {
                    startTime: event.timestamp,
                    moves: 0,
                });
                this.stats.gamesPerHour.set(
                    hour,
                    (this.stats.gamesPerHour.get(hour) || 0) + 1
                );
                console.log(`🎮 Game started: ${event.gameId}`);
                console.log(`   Players: ${event.data.player1} vs ${event.data.player2}`);
                break;

            case 'move':
                this.stats.totalMoves++;
                const activeGame = this.activeGames.get(event.gameId);
                if (activeGame) {
                    activeGame.moves++;
                }
                console.log(`🎯 Move: ${event.data.player} → Column ${event.data.column}`);
                break;

            case 'game_end':
                const game = this.activeGames.get(event.gameId);
                if (game) {
                    const duration = event.data.duration ||
                        Math.floor((event.timestamp - game.startTime) / 1000);
                    this.stats.totalDuration += duration;
                    this.activeGames.delete(event.gameId);
                }

                if (event.data.winner) {
                    const currentWins = this.stats.wins.get(event.data.winner) || 0;
                    this.stats.wins.set(event.data.winner, currentWins + 1);
                }

                console.log(`🏁 Game ended: ${event.gameId}`);
                console.log(`   Result: ${event.data.result} | Winner: ${event.data.winner || 'Draw'}`);
                console.log(`   Duration: ${event.data.duration}s`);
                this.printStats();
                break;

            case 'player_disconnect':
                console.log(`⚠️  Player disconnected: ${event.data.player} (Game: ${event.gameId})`);
                break;

            case 'player_reconnect':
                console.log(`✅ Player reconnected: ${event.data.player} (Game: ${event.gameId})`);
                break;
        }
    }

    private printStats(): void {
        const avgDuration = this.stats.totalGames > 0
            ? Math.round(this.stats.totalDuration / this.stats.totalGames)
            : 0;
        const avgMoves = this.stats.totalGames > 0
            ? Math.round(this.stats.totalMoves / this.stats.totalGames)
            : 0;

        console.log('\n📊 Current Stats:');
        console.log(`   Total Games: ${this.stats.totalGames}`);
        console.log(`   Total Moves: ${this.stats.totalMoves}`);
        console.log(`   Avg Duration: ${avgDuration}s`);
        console.log(`   Avg Moves/Game: ${avgMoves}`);

        if (this.stats.wins.size > 0) {
            console.log('   Top Players:');
            const sorted = [...this.stats.wins.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            sorted.forEach(([player, wins]) => {
                console.log(`     ${player}: ${wins} wins`);
            });
        }
        console.log('');
    }

    async stop(): Promise<void> {
        await this.consumer.disconnect();
        console.log('🔌 Consumer disconnected');
    }
}

const consumer = new AnalyticsConsumer();

process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await consumer.stop();
    process.exit(0);
});

console.log(`
╔═══════════════════════════════════════════════════════╗
║        📊 Nexus4 Analytics Consumer 📊                ║
╠═══════════════════════════════════════════════════════╣
║  Kafka Broker: ${KAFKA_BROKER.padEnd(35)}   ║
║  Topic: ${TOPIC.padEnd(43)}   ║
╚═══════════════════════════════════════════════════════╝
`);

consumer.start().catch(console.error);
