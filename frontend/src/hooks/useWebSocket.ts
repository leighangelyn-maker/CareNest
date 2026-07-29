import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import { BASE_HOST } from '../api/client';
import { ApiMessage } from '../types';

export type WsStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export function useWebSocket(conversationId: string, token: string | null) {
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [status, setStatus] = useState<WsStatus>('disconnected');
  const clientRef = useRef<Client | null>(null);
  const retryDelayRef = useRef(1000);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    const delay = Math.min(retryDelayRef.current, 30000);
    retryDelayRef.current = Math.min(retryDelayRef.current * 2, 30000);
    retryTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) connectClient();
    }, delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, token]);

  const connectClient = useCallback(() => {
    if (!token || !isMountedRef.current) return;
    if (clientRef.current?.active) {
      clientRef.current.deactivate();
    }

    setStatus('connecting');

    const client = new Client({
      brokerURL: `ws://${BASE_HOST}/ws?token=${token}`,
      reconnectDelay: 0,
      onConnect: () => {
        if (!isMountedRef.current) return;
        setStatus('connected');
        retryDelayRef.current = 1000;
        client.subscribe(`/topic/conversation.${conversationId}`, (frame: IMessage) => {
          try {
            const msg: ApiMessage = JSON.parse(frame.body);
            if (isMountedRef.current) {
              setMessages((prev) => [...prev, msg]);
            }
          } catch {}
        });
      },
      onDisconnect: () => {
        if (!isMountedRef.current) return;
        setStatus('reconnecting');
        scheduleReconnect();
      },
      onStompError: () => {
        if (!isMountedRef.current) return;
        setStatus('reconnecting');
        scheduleReconnect();
      },
      onWebSocketError: () => {
        if (!isMountedRef.current) return;
        setStatus('reconnecting');
        scheduleReconnect();
      },
    });

    clientRef.current = client;
    client.activate();
  }, [conversationId, token, scheduleReconnect]);

  useEffect(() => {
    isMountedRef.current = true;
    connectClient();
    return () => {
      isMountedRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      clientRef.current?.deactivate();
      setStatus('disconnected');
    };
  }, [connectClient]);

  // sendMessage is kept for backward compat but REST-based send is preferred
  const sendMessage = useCallback(
    (content: string) => {
      if (clientRef.current?.connected) {
        clientRef.current.publish({
          destination: `/app/conversation/${conversationId}`,
          body: JSON.stringify({ content }),
        });
      }
    },
    [conversationId],
  );

  return { messages, sendMessage, status };
}
