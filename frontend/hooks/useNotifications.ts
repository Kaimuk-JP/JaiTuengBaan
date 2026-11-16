'use client';

import { useEffect, useState, useCallback } from 'react';
import { getApiUrl } from '@/lib/api';

interface PendingQueue {
    id: number;
    hospitalName: string;
    requestDate: string;
    bookingTime: string | null;
    status: string;
}

export function useNotifications(userId: number | undefined) {
    const [pendingQueues, setPendingQueues] = useState<PendingQueue[]>([]);
    const [hasNotification, setHasNotification] = useState(false);

    const checkPendingQueues = useCallback(async () => {
        if (!userId) return;

        try {
                        const response = await fetch(`${getApiUrl()}/queues/user/${userId}/latest`, {
                credentials: 'include',
            });

            if (!response.ok) {
                setPendingQueues([]);
                setHasNotification(false);
                return;
            }

            const text = await response.text();
            if (!text || text.trim() === '') {
                setPendingQueues([]);
                setHasNotification(false);
                return;
            }

            const data = JSON.parse(text);

            if (data && data.status === 'APPROVED' && !data.confirmedByUser) {
                setPendingQueues([data]);
                setHasNotification(!data.notificationReadAt);
            } else {
                setPendingQueues([]);
                setHasNotification(false);
            }
        } catch (error) {
            console.error('[useNotifications] Error checking pending queues:', error);
            setPendingQueues([]);
            setHasNotification(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        checkPendingQueues();

        const interval = setInterval(checkPendingQueues, 30000);

        return () => clearInterval(interval);
    }, [userId]);

    return {
        pendingQueues,
        hasNotification,
        notificationCount: pendingQueues.length,
        refreshNotifications: checkPendingQueues,
    };
}
