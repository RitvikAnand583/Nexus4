import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';

interface ClientMessage {
    type: 'join' | 'findGame' | 'cancelQueue' | 'move' | 'rejoin' | '_disconnect' |
    'voice_request' | 'voice_accept' | 'voice_decline' |
    'rtc_offer' | 'rtc_answer' | 'rtc_ice_candidate';
    username?: string;
    column?: number;
    gameId?: string;
    offer?: any;
    answer?: any;
    candidate?: any;
}

interface ServerMessage {
    type: string;
    [key: string]: any;
}
interface GameWebSocket extends WebSocket {
    id: string;
    username?: string;
    isAlive: boolean;
}

type MessageHandler = (ws: GameWebSocket, message: ClientMessage) => void;

class WebSocketHandler {
    private wss: WebSocketServer | null = null;
    private clients: Map<string, GameWebSocket> = new Map();
    private userSockets: Map<string, string> = new Map();
    private messageHandlers: Map<string, MessageHandler> = new Map();
    private pingInterval: NodeJS.Timeout | null = null;

    initialize(server: Server): void {
        this.wss = new WebSocketServer({ server });

        this.wss.on('connection', (ws: WebSocket) => {
            this.handleConnection(ws as GameWebSocket);
        });

        this.pingInterval = setInterval(() => {
            this.clients.forEach((ws, id) => {
                if (!ws.isAlive) {
                    this.handleDisconnect(ws);
                    return;
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);

        console.log('✅ WebSocket server initialized');
    }

    onMessage(type: string, handler: MessageHandler): void {
        this.messageHandlers.set(type, handler);
    }


    private handleConnection(ws: GameWebSocket): void {
        ws.id = uuidv4();
        ws.isAlive = true;
        this.clients.set(ws.id, ws);

        console.log(`🔌 Client connected: ${ws.id}`);

        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', (data: Buffer) => {
            try {
                const message: ClientMessage = JSON.parse(data.toString());
                this.handleMessage(ws, message);
            } catch (error) {
                this.send(ws, { type: 'error', message: 'Invalid message format' });
            }
        });

        ws.on('close', () => {
            this.handleDisconnect(ws);
        });

        ws.on('error', (error) => {
            console.error(`WebSocket error for ${ws.id}:`, error.message);
        });
    }

    private handleMessage(ws: GameWebSocket, message: ClientMessage): void {
        const handler = this.messageHandlers.get(message.type);

        if (handler) {
            handler(ws, message);
        } else {
            this.send(ws, { type: 'error', message: `Unknown message type: ${message.type}` });
        }
    }

    private handleDisconnect(ws: GameWebSocket): void {
        console.log(`🔌 Client disconnected: ${ws.id} (${ws.username || 'anonymous'})`);

        const disconnectHandler = this.messageHandlers.get('_disconnect');
        if (disconnectHandler) {
            disconnectHandler(ws, { type: '_disconnect' });
        }

        if (ws.username) {
            this.userSockets.delete(ws.username);
        }
        this.clients.delete(ws.id);
        ws.terminate();
    }

    send(ws: GameWebSocket, message: ServerMessage): void {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }


    sendToUser(username: string, message: ServerMessage): boolean {
        const socketId = this.userSockets.get(username);
        if (socketId) {
            const ws = this.clients.get(socketId);
            if (ws) {
                this.send(ws, message);
                return true;
            }
        }
        return false;
    }


    registerUser(ws: GameWebSocket, username: string): void {
        ws.username = username;
        this.userSockets.set(username, ws.id);
    }

    getSocketByUsername(username: string): GameWebSocket | undefined {
        const socketId = this.userSockets.get(username);
        return socketId ? this.clients.get(socketId) : undefined;
    }


    getConnectionCount(): number {
        return this.clients.size;
    }

    shutdown(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        this.clients.forEach((ws) => ws.terminate());
        this.wss?.close();
    }
}

export const wsHandler = new WebSocketHandler();
export type { GameWebSocket, ClientMessage, ServerMessage };
