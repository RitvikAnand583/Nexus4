import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const USERNAME_KEY = 'Nxus_username';

interface ServerMessage {
    type: string;
    [key: string]: any;
}

export function useWebSocket() {
    const [connected, setConnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const [messageQueue, setMessageQueue] = useState<ServerMessage[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
                // Add to queue instead of overwriting
                setMessageQueue(prev => [...prev, message]);
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

    // Get the last message (for backward compatibility, returns first in queue)
    const lastMessage = messageQueue.length > 0 ? messageQueue[0] : null;

    // Clear the processed message from queue
    const clearLastMessage = useCallback(() => {
        setMessageQueue(prev => prev.slice(1));
    }, []);

    return {
        connected,
        reconnecting,
        lastMessage,
        clearLastMessage,
        send,
        setStoredUsername,
        clearStoredUsername,
        getStoredUsername
    };
}
