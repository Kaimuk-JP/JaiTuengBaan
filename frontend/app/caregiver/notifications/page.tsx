'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import LayoutWithSidebar from '@/components/shared/LayoutWithSidebar';
import { CaregiverSidebar } from '@/components/caregiver/sidebar';
import { CaregiverHeader } from '@/components/caregiver/header';
import { useSocket } from '@/contexts/SocketContext';
import { isActionRequired } from '@/utils/govNotificationHelpers';
import { fetchWithAuth } from '@/lib/auth';
import NotificationDetailModal from '@/components/notification/NotificationDetailModal';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    data?: any;
}

function NotificationsPageContent() {
    const router = useRouter();
    const { notifications: socketNotifications, markAsRead, unreadCount } = useSocket();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'action'>('all');
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (socketNotifications.length > 0) {
            const formatted = socketNotifications.map((n: any) => ({
                id: n.id,
                type: n.type,
                title: getNotificationTitle(n.type),
                message: n.message,
                isRead: n.isRead,
                createdAt: n.createdAt,
                data: n.data,
            }));
            setNotifications(formatted);
        }
    }, [socketNotifications]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await fetchWithAuth('/notifications?limit=50');
            if (response.ok) {
                const data = await response.json();
                const formatted = (data.notifications || []).map((n: any) => ({
                    id: n.id,
                    type: n.type,
                    title: getNotificationTitle(n.type),
                    message: n.message,
                    isRead: n.isRead,
                    createdAt: n.createdAt,
                    data: n.data,
                }));
                setNotifications(formatted);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const getNotificationTitle = (type: string): string => {
        const titles: Record<string, string> = {
            QUEUE_APPROVED: 'การจองของประชาชนได้รับการอนุมัติ',
            QUEUE_REJECTED: 'การจองของประชาชนถูกปฏิเสธ',
            QUEUE_EDITED: 'ข้อมูลการจองถูกแก้ไข',
            BOOKING_APPROVED: 'การจองได้รับการอนุมัติ',
            BOOKING_REJECTED: 'การจองถูกปฏิเสธ',
            VOLUNTEER_ASSIGNED: 'มีจิตอาสารับงาน',
            SERVICE_COMPLETED: 'บริการเสร็จสิ้น',
            FEEDBACK_REQUEST: 'กรุณาให้คะแนน',
            JOB_STATUS_UPDATED: 'อัพเดทสถานะงาน',
            JOB_ACCEPTED: 'อาสาสมัครรับงานแล้ว',
            JOB_COMPLETED: 'บริการเสร็จสิ้น',
        };
        return titles[type] || 'การแจ้งเตือน';
    };

    const getNotificationIcon = (type: string): string => {
        const icons: Record<string, string> = {
            QUEUE_APPROVED: '',
            QUEUE_REJECTED: '❌',
            QUEUE_EDITED: '📝',
            BOOKING_APPROVED: '',
            BOOKING_REJECTED: '⚠️',
            VOLUNTEER_ASSIGNED: '👤',
            SERVICE_COMPLETED: '🎉',
            FEEDBACK_REQUEST: '⭐',
            JOB_STATUS_UPDATED: '📋',
            JOB_ACCEPTED: '',
            JOB_COMPLETED: '🎉',
            EDIT_REQUEST_APPROVED: '',
            EDIT_REQUEST_REJECTED: '⚠️',
        };
        return icons[type] || '🔔';
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await handleMarkAsRead(notification.id);
        }

        if (['QUEUE_APPROVED', 'QUEUE_REJECTED', 'QUEUE_EDITED', 'VOLUNTEER_ASSIGNED', 'FEEDBACK_REQUEST', 'JOB_ACCEPTED', 'JOB_COMPLETED', 'JOB_STATUS_UPDATED'].includes(notification.type)) {
            setSelectedNotification(notification);
            setIsModalOpen(true);
        }
    };

    const handleMarkAsRead = async (notificationId: number) => {
        try {
            await markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const response = await fetchWithAuth('/notifications/mark-all-read', {
                method: 'PUT',
            });
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'เมื่อวาน';
        } else if (days < 7) {
            return `${days} วันที่แล้ว`;
        } else {
            return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
        }
    };

    const isCaregiverAction = (n: Notification) =>
        isActionRequired(n.type, 'CAREGIVER', n.data);

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.isRead)
        : filter === 'action'
            ? notifications.filter(isCaregiverAction)
            : notifications;

    return (
        <LayoutWithSidebar role="CAREGIVER" showSidebar={false} user={null}>
            <CaregiverSidebar user={null} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="min-h-screen bg-white">
                { }
                <header className="bg-white border-b border-border-neutral sticky top-0 z-10">
                    <div className="px-3x py-3x">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2x">
                                <button
                                    onClick={() => router.back()}
                                    className="p-1x hover:bg-field-default rounded-square transition-colors"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <h1 className="typo-body font-bold text-text-primary">การแจ้งเตือนทั้งหมด</h1>
                            </div>


                        </div>

                        { }
                        <div className="mt-2x flex gap-1x flex-wrap">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-3x py-1x rounded-circle typo-menu font-medium transition-colors ${filter === 'all'
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-field-default text-text-tertiary hover:bg-fuji-soft'
                                    }`}
                            >
                                ทั้งหมด ({notifications.length})
                            </button>
                            <button
                                onClick={() => setFilter('action')}
                                className={`px-3x py-1x rounded-circle typo-menu font-medium transition-colors ${filter === 'action'
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-field-default text-text-tertiary hover:bg-fuji-soft'
                                    }`}
                            >
                                ต้องดำเนินการ ({notifications.filter(isCaregiverAction).length})
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`px-3x py-1x rounded-circle typo-menu font-medium transition-colors ${filter === 'unread'
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-field-default text-text-tertiary hover:bg-fuji-soft'
                                    }`}
                            >
                                ยังไม่อ่าน ({unreadCount})
                            </button>
                        </div>
                    </div>
                </header>

                { }
                <main className="p-3x">
                    {loading ? (
                        <div className="flex justify-center py-6x">
                            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-6x">
                            <div className="text-6xl mb-2x"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_4768_42)">
                                    <path d="M22.2026 13.4485L20.3323 6.71934C19.7841 4.74797 18.5926 3.01641 16.9473 1.7999C15.3021 0.583393 13.2973 -0.0482473 11.2519 0.00538155C9.20639 0.0590104 7.23753 0.794831 5.65826 2.09588C4.07898 3.39693 2.97991 5.18854 2.53576 7.18594L1.08774 13.6976C0.927794 14.4171 0.931492 15.1633 1.09856 15.8812C1.26563 16.5991 1.5918 17.2703 2.053 17.8453C2.5142 18.4203 3.09864 18.8843 3.76318 19.2031C4.42773 19.522 5.1554 19.6875 5.89247 19.6875H6.98907C7.215 20.8001 7.81863 21.8004 8.69769 22.5189C9.57675 23.2374 10.6772 23.6299 11.8125 23.6299C12.9478 23.6299 14.0483 23.2374 14.9273 22.5189C15.8064 21.8004 16.41 20.8001 16.6359 19.6875H17.4608C18.2196 19.6876 18.9681 19.5122 19.6479 19.1751C20.3277 18.838 20.9203 18.3483 21.3795 17.7442C21.8387 17.1402 22.152 16.4381 22.2949 15.6929C22.4379 14.9478 22.4056 14.1796 22.2026 13.4485ZM11.8125 21.6562C11.2039 21.6537 10.6109 21.4632 10.1148 21.1108C9.61856 20.7584 9.24337 20.2613 9.04051 19.6875H14.5845C14.3816 20.2613 14.0064 20.7584 13.5103 21.1108C13.0141 21.4632 12.4211 21.6537 11.8125 21.6562ZM19.8115 16.5523C19.5372 16.9162 19.1819 17.2111 18.7736 17.4136C18.3654 17.6161 17.9156 17.7205 17.4599 17.7188H5.89247C5.45028 17.7187 5.01374 17.6193 4.61509 17.4279C4.21644 17.2366 3.86585 16.9582 3.5892 16.6132C3.31254 16.2682 3.11689 15.8655 3.01668 15.4348C2.91647 15.0042 2.91427 14.5565 3.01022 14.1248L4.45726 7.61217C4.80607 6.04328 5.66932 4.63602 6.90978 3.61408C8.15024 2.59215 9.69671 2.0142 11.3034 1.97211C12.91 1.93002 14.4846 2.42621 15.7769 3.38179C17.0691 4.33737 18.0049 5.69751 18.4354 7.24598L20.3057 13.9752C20.4293 14.4136 20.449 14.8748 20.3632 15.3221C20.2774 15.7695 20.0885 16.1907 19.8115 16.5523Z" fill="#060D26" />
                                </g>
                                <defs>
                                    <clipPath id="clip0_4768_42">
                                        <rect width="23.625" height="23.625" fill="white" />
                                    </clipPath>
                                </defs>
                            </svg>
                            </div>
                            <p className="typo-body text-text-tertiary">
                                {filter === 'unread' ? 'ไม่มีการแจ้งเตือนที่ยังไม่อ่าน' : 'ไม่มีการแจ้งเตือน'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2x">
                            {filteredNotifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full p-3x bg-white rounded-square-hard shadow-smooth-low border transition-all text-left ${!notification.isRead
                                        ? 'border-brand-primary bg-apple-soft'
                                        : 'border-border-neutral hover:border-border-hover'
                                        }`}
                                >
                                    <div className="flex items-start gap-2x">
                                        { }
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${!notification.isRead ? 'bg-apple-light' : 'bg-field-default'
                                            }`}>
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        { }
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-1x">
                                                <h3 className={`text-base font-semibold ${!notification.isRead ? 'text-brand-primary' : 'text-text-primary'}`}>
                                                    {notification.title}
                                                </h3>
                                                {!notification.isRead && (
                                                    <span className="flex-shrink-0 w-2 h-2 bg-brand-primary rounded-full mt-2" />
                                                )}
                                            </div>
                                            <p className="typo-menu text-text-tertiary mt-1x line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="typo-tags text-text-placeholder mt-1x">
                                                {formatDate(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            { }
            <NotificationDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                notification={selectedNotification}
                userRole="CAREGIVER"
            />
        </LayoutWithSidebar>
    );
}

export default function NotificationsPage() {
    return (
        <ProtectedRoute allowedRoles={['CAREGIVER', 'DRIVE', 'STAFF', 'ADMIN']}>
            <NotificationsPageContent />
        </ProtectedRoute>
    );
}
