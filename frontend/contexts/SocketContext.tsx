'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getApiUrl } from '@/lib/api';

import MunicipalRatingModal from '@/components/feedback/MunicipalRatingModal';

export interface Notification {
    id: number;
    userId: number;
    type: string;
    title: string;
    message: string;
    data: any;
    read: boolean;
    createdAt: string;
    updatedAt: string;
}

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    notifications: Notification[];
    unreadCount: number;
    hasMore: boolean;
    isLoading: boolean;
    addNotification: (notification: Notification) => void;
    markAsRead: (notificationId: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: number) => Promise<void>;
    fetchNotifications: () => Promise<void>;
    loadMore: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

interface SocketProviderProps {
    children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);



    const [showMunicipalModal, setShowMunicipalModal] = useState(false);
    const [municipalJobId, setMunicipalJobId] = useState<number | null>(null);
    const [skippedMunicipalJobIds, setSkippedMunicipalJobIds] = useState<Set<number>>(new Set());

    const fetchingRef = useRef(false);
    const fetchNotifications = useCallback(async () => {
        if (!user || fetchingRef.current) return;
        fetchingRef.current = true;

        try {
            setIsLoading(true);
            const response = await fetch(`${getApiUrl()}/notifications?page=1&limit=50`, {
                credentials: 'include',
            });

            if (response.ok) {
                const result = await response.json();

                const filteredNotifications = await filterRatedFeedbackNotifications(result.data || []);

                setNotifications(filteredNotifications);

                let unread = typeof result.unreadCount === 'number' ? result.unreadCount : 0;
                try {
                    const countRes = await fetch(`${getApiUrl()}/notifications/unread-count`, {
                        credentials: 'include',
                    });
                    if (countRes.ok) {
                        const body = await countRes.json();
                        if (typeof body.count === 'number') {
                            unread = body.count;
                        }
                    }
                } catch {
                }
                setUnreadCount(unread);
                setCurrentPage(1);
                setHasMore(result.pagination?.hasNextPage || false);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            fetchingRef.current = false;
            setIsLoading(false);
        }
    }, [user]);

    const filterRatedFeedbackNotifications = async (notifications: Notification[]) => {
        const filtered = [];

        for (const notification of notifications) {
            if (notification.type === 'FEEDBACK_REQUEST' && notification.data?.jobId) {
                try {
                    const response = await fetch(`${getApiUrl()}/jobs/${notification.data.jobId}`, {
                        credentials: 'include',
                    });

                    if (response.ok) {
                        const text = await response.text();
                        if (text) {
                            try {
                                const job = JSON.parse(text);
                                if (job.ratingScore !== null) {
                                    continue;
                                }
                            } catch {
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error checking job rating:', error);
                }
            }
            filtered.push(notification);
        }

        return filtered;
    };

    const checkPendingMunicipalRating = useCallback(async () => {
        if (!user || (user.role !== 'USERS' && user.role !== 'CAREGIVER')) return;

        try {
            const url = `${getApiUrl()}/jobs/my-pending-ratings`;
            const response = await fetch(url, { credentials: 'include' });

            if (!response.ok) return;

            const jobs = await response.json();

            const pendingJob = jobs.find((job: any) =>
                job.ratingScore !== null &&
                !job.municipalRating &&
                !skippedMunicipalJobIds.has(job.id)
            );

            if (pendingJob && !showMunicipalModal) {
                setMunicipalJobId(pendingJob.id);
                setShowMunicipalModal(true);
            }
        } catch (error) {
            console.error('[SocketContext] Error checking pending municipal rating:', error);
        }
    }, [user, skippedMunicipalJobIds, showMunicipalModal]);

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        const socketUrl = getApiUrl().startsWith('http') ? getApiUrl() : undefined;
        const newSocket = io(getApiUrl() || window.location.origin, {
            withCredentials: true,
            transports: ['websocket'],
            path: socketUrl ? '/socket.io' : '/api/socket.io',
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        newSocket.on('connect', () => {
            setIsConnected(true);

            newSocket.emit('register', {
                userId: user.id,
                role: user.role,
            });

            fetchNotifications();

            setTimeout(() => checkPendingMunicipalRating(), 2000);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('reconnect', () => {
            setIsConnected(true);
            newSocket.emit('register', {
                userId: user.id,
                role: user.role,
            });
        });

        newSocket.on('notification', (notification: Notification) => {
            addNotification(notification);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    const addNotification = useCallback((notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/Assets/logo.png',
            });
        }
    }, []);

    const markAsRead = useCallback(async (notificationId: number) => {
        try {
            const response = await fetch(`${getApiUrl()}/notifications/${notificationId}/read`, {
                method: 'PATCH',
                credentials: 'include',
            });

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === notificationId ? { ...n, read: true } : n
                    )
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            const response = await fetch(`${getApiUrl()}/notifications/read-all`, {
                method: 'PATCH',
                credentials: 'include',
            });

            if (response.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }, []);

    const deleteNotification = useCallback(async (notificationId: number) => {
        try {
            const response = await fetch(`${getApiUrl()}/notifications/${notificationId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                setNotifications((prev) => {
                    const notification = prev.find((n) => n.id === notificationId);
                    if (notification && !notification.read) {
                        setUnreadCount((count) => Math.max(0, count - 1));
                    }
                    return prev.filter((n) => n.id !== notificationId);
                });
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    }, []);

    const loadMore = useCallback(async () => {
        if (!user || isLoading || !hasMore) return;

        try {
            setIsLoading(true);
            const nextPage = currentPage + 1;
            const response = await fetch(`${getApiUrl()}/notifications?page=${nextPage}&limit=20`, {
                credentials: 'include',
            });

            if (response.ok) {
                const result = await response.json();
                setNotifications((prev) => [...prev, ...(result.data || [])]);
                setCurrentPage(nextPage);
                setHasMore(result.pagination?.hasNextPage || false);
            }
        } catch (error) {
            console.error('Failed to load more notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, currentPage, hasMore, isLoading]);

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const value: SocketContextType = {
        socket,
        isConnected,
        notifications,
        unreadCount,
        hasMore,
        isLoading,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        fetchNotifications,
        loadMore,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}



            {}
            {showMunicipalModal && municipalJobId && (
                <MunicipalRatingModal
                    isOpen={showMunicipalModal}
                    onClose={() => {
                        setShowMunicipalModal(false);
                        setMunicipalJobId(null);
                    }}
                    onSubmit={() => {
                        setShowMunicipalModal(false);
                        setMunicipalJobId(null);
                    }}
                    onSkip={() => {
                        if (municipalJobId) {
                            setSkippedMunicipalJobIds(prev => new Set([...prev, municipalJobId]));
                        }
                        setShowMunicipalModal(false);
                        setMunicipalJobId(null);
                    }}
                    jobId={municipalJobId}
                />
            )}
        </SocketContext.Provider>
    );
};
