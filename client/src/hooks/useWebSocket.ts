import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const USERNAME_KEY = 'nexus4_username';

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

    const getStoredUsername = useCallback((): string | null => {
        return localStorage.getItem(USERNAME_KEY);
    }, []);

    const setStoredUsername = useCallback((username: string | null) => {
        if (username) {
            localStorage.setItem(USERNAME_KEY, username);
        } else {
            localStorage.removeItem(USERNAME_KEY);
        }
    }, []);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            setConnected(true);
            setReconnecting(false);
            console.log('WebSocket connected');

            const storedUsername = getStoredUsername();
            if (storedUsername) {
                console.log(`Attempting to rejoin as ${storedUsername}`);
                ws.send(JSON.stringify({ type: 'rejoin', username: storedUsername }));
            }
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
    }, [getStoredUsername]);

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

    const clearStoredUsername = useCallback(() => {
        setStoredUsername(null);
    }, [setStoredUsername]);

    return { connected, reconnecting, lastMessage, send, setStoredUsername, clearStoredUsername, getStoredUsername };
}
