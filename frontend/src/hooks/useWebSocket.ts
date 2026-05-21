'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { WSMessage } from '@/types';

const getWsUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
    }
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}/_/backend`;
  }
  return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
};

const WS_URL = getWsUrl();

interface UseWebSocketOptions {
  roomId: string;
  onMessage: (msg: WSMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket({ roomId, onMessage, onConnect, onDisconnect }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isConnectedRef = useRef(false);

  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
  }, [onMessage, onConnect, onDisconnect]);

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !roomId) return;

    const ws = new WebSocket(`${WS_URL}/ws/${roomId}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      isConnectedRef.current = true;
      reconnectAttemptsRef.current = 0;
      onConnectRef.current?.();

      // Heartbeat every 25s
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat', payload: {} }));
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        onMessageRef.current(msg);
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };

    ws.onclose = () => {
      if (wsRef.current !== ws) return;
      isConnectedRef.current = false;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      onDisconnectRef.current?.();

      // Exponential backoff reconnect
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 16000);
      reconnectAttemptsRef.current++;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [roomId]);

  const sendMessage = useCallback((msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    reconnectAttemptsRef.current = 999; // prevent reconnect
    wsRef.current?.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { sendMessage, disconnect, isConnected: isConnectedRef };
}
