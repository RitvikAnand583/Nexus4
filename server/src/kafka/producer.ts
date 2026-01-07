import { Kafka, Producer, logLevel } from 'kafkajs';

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const TOPIC = 'game-events';

interface GameEvent {
    type: 'game_start' | 'move' | 'game_end' | 'player_disconnect' | 'player_reconnect';
    gameId: string;
    timestamp: number;
    data: Record<string, any>;
}

class KafkaProducer {
    private kafka: Kafka;
    private producer: Producer;
    private connected: boolean = false;

    constructor() {
        this.kafka = new Kafka({
            clientId: 'nexus4-server',
            brokers: [KAFKA_BROKER],
            logLevel: logLevel.ERROR,
            retry: {
                initialRetryTime: 300,
                retries: 5,
            },
        });
        this.producer = this.kafka.producer();
    }

    async connect(): Promise<void> {
        try {
            await this.producer.connect();
            this.connected = true;
            console.log('✅ Kafka producer connected');
        } catch (error) {
            console.warn('⚠️ Kafka not available, events will not be published');
            this.connected = false;
        }
    }

    async disconnect(): Promise<void> {
        if (this.connected) {
            await this.producer.disconnect();
            this.connected = false;
        }
    }

    async publishEvent(event: GameEvent): Promise<void> {
        if (!this.connected) return;

        try {
            await this.producer.send({
                topic: TOPIC,
                messages: [
                    {
                        key: event.gameId,
                        value: JSON.stringify(event),
                        timestamp: String(event.timestamp),
                    },
                ],
            });
        } catch (error) {
            console.error('Failed to publish event:', error);
        }
    }

    async gameStarted(gameId: string, player1: string, player2: string, isBotGame: boolean): Promise<void> {
        await this.publishEvent({
            type: 'game_start',
            gameId,
            timestamp: Date.now(),
            data: { player1, player2, isBotGame },
        });
    }

    async moveMade(gameId: string, player: string, column: number, playerNumber: number): Promise<void> {
        await this.publishEvent({
            type: 'move',
            gameId,
            timestamp: Date.now(),
            data: { player, column, playerNumber },
        });
    }

    async gameEnded(gameId: string, winner: string | null, result: string, durationSeconds: number, player1: string, player2: string, isBotGame: boolean): Promise<void> {
        await this.publishEvent({
            type: 'game_end',
            gameId,
            timestamp: Date.now(),
            data: { winner, result, durationSeconds, player1, player2, isBotGame },
        });
    }

    async playerDisconnected(gameId: string, player: string): Promise<void> {
        await this.publishEvent({
            type: 'player_disconnect',
            gameId,
            timestamp: Date.now(),
            data: { player },
        });
    }

    async playerReconnected(gameId: string, player: string): Promise<void> {
        await this.publishEvent({
            type: 'player_reconnect',
            gameId,
            timestamp: Date.now(),
            data: { player },
        });
    }
}

export const kafkaProducer = new KafkaProducer();
