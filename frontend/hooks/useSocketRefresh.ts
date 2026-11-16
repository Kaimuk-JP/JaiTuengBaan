'use client';

import { useEffect } from 'react';
import { useSocket, Notification } from '@/contexts/SocketContext';

export function useSocketRefresh(
    refresh: () => void,
    events: string | string[],
    filter?: (notification: Notification) => boolean
) {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        const eventList = Array.isArray(events) ? events : [events];

        const handleEvent = (payload: any) => {
            if (filter && payload && typeof payload === 'object' && 'type' in payload) {
                if (!filter(payload as Notification)) return;
            }
            refresh();
        };

        eventList.forEach((evt) => socket.on(evt, handleEvent));

        return () => {
            eventList.forEach((evt) => socket.off(evt, handleEvent));
        };
    }, [socket, refresh, events, filter]);
}
