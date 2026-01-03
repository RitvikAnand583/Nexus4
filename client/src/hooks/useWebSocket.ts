import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:3001';

interface ServerMessage {
    type: string;
    [key: string]: any;
}

export function useWebSocket() {
    const [connected, setConnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            setConnected(true);
            setReconnecting(false);
            console.log('WebSocket connected');
        };

        ws.onclose = () => {
            setConnected(false);
            console.log('WebSocket disconnected');
            reconnectTimeoutRef.current = setTimeout(() => {
                setReconnecting(true);
                connect();
            }, 2000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                setLastMessage(message);
            } catch (e) {
                console.error('Failed to parse message:', e);
            }
        };

        wsRef.current = ws;
    }, []);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            wsRef.current?.close();
        };
    }, [connect]);

    const send = useCallback((message: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    return { connected, reconnecting, lastMessage, send };
}
