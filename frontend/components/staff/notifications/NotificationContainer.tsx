'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket, Notification } from '@/contexts/SocketContext';
import {
    Bell,
    CheckCheck,
    RefreshCw,
    Trash2,
    Calendar,
    UserPlus,
    UserCheck,
    Award,
    AlertCircle,
    ChevronRight,
    Loader2,
    FileEdit,
    Car,
    Clock,
    Sparkles,
} from 'lucide-react';

export default function NotificationContainer() {
    const router = useRouter();
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        fetchNotifications,
        isLoading,
    } = useSocket();

    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [rotation, setRotation] = useState(0);

    const handleRefresh = async () => {
        setRotation((prev) => prev + 360);
        try {
            await fetchNotifications();
        } catch (err) {
            console.error('Refresh error:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const timer = setTimeout(() => {
            if (unreadCount > 0) {
                markAllAsRead();
            }
        }, 1200);
        return () => clearTimeout(timer);
    }, [unreadCount, markAllAsRead, fetchNotifications]);

    const getNotificationMeta = (notification: Notification) => {
        const type = (notification.type || '').toUpperCase();
        const data = notification.data || {};

        if (
            type.includes('ROLE_REQUEST') ||
            type.includes('ROLE') ||
            data.roleRequestId
        ) {
            const roleRequestId = data.roleRequestId || data.requestId;
            return {
                title: notification.title || 'คำร้องขอเปลี่ยนโรล/บทบาท',
                icon: UserCheck,
                iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                link: roleRequestId ? `/staff/role/${roleRequestId}` : '/staff/petition?tab=role',
            };
        }

        if (type.includes('CAREGIVER') || data.caregiverId || data.caregiverRequestId) {
            return {
                title: notification.title || 'คำร้องขอเป็นผู้ดูแลประชาชน',
                icon: UserPlus,
                iconBg: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
                link: '/staff/petition?tab=caregiver',
            };
        }

        if (type.includes('EDIT_REQUEST') || type.includes('PROFILE_EDIT')) {
            return {
                title: notification.title || 'คำร้องแก้ไขข้อมูลส่วนตัว',
                icon: FileEdit,
                iconBg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
                link: '/staff/petition?tab=edit',
            };
        }

        if (type.includes('REWARD')) {
            return {
                title: notification.title || 'คำร้องขอแลกของรางวัล',
                icon: Award,
                iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                link: '/staff/rewards',
            };
        }

        if (
            type.includes('QUEUE') ||
            type.includes('BOOKING') ||
            data.queueId
        ) {
            return {
                title: notification.title || 'คำขอจองคิวรับ-ส่ง',
                icon: Calendar,
                iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                link: '/staff/petition',
            };
        }

        if (
            type.includes('JOB') ||
            type.includes('VOLUNTEER') ||
            type.includes('SERVICE')
        ) {
            return {
                title: notification.title || 'อัปเดตงานจิตอาสา',
                icon: Car,
                iconBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
                link: '/staff/dashboard',
            };
        }

        if (type.includes('VEHICLE') || type.includes('MILEAGE')) {
            return {
                title: notification.title || 'การจัดการยานพาหนะ',
                icon: Car,
                iconBg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
                link: '/staff/vehicles',
            };
        }

        if (type.includes('FEEDBACK') || type.includes('RATING')) {
            return {
                title: notification.title || 'ความคิดเห็นและการประเมิน',
                icon: Award,
                iconBg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
                link: '/staff/reports',
            };
        }

        return {
            title: notification.title || 'การแจ้งเตือน',
            icon: Bell,
            iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
            link: '/staff/dashboard',
        };
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) return 'เมื่อสักครู่';
        if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;
        if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
        if (diffDays === 1) {
            return `เมื่อวาน เวลา ${date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;
        }
        if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleNotificationClick = async (notification: Notification, link?: string) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        if (link) {
            router.push(link);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            setDeletingId(id);
            await deleteNotification(id);
        } catch (err) {
            console.error('Failed to delete notification:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const filteredNotifications = activeTab === 'unread'
        ? notifications.filter((n) => !n.read)
        : notifications;

    const unreadItemsCount = notifications.filter((n) => !n.read).length;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>การแจ้งเตือน</span>
                            {unreadCount > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full">
                                    {unreadCount} ใหม่
                                </span>
                            )}
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            ศูนย์รวมการแจ้งเตือนงานและคำร้องทั้งหมดในระบบ
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {unreadItemsCount > 0 && (
                        <button
                            type="button"
                            onClick={() => markAllAsRead()}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 rounded-xl transition border border-emerald-200 dark:border-emerald-800/40"
                        >
                            <CheckCheck className="w-4 h-4" />
                            <span>อ่านทั้งหมดแล้ว</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleRefresh}
                        title="รีเฟรชข้อมูล"
                        className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-600 active:scale-95 cursor-pointer"
                    >
                        <RefreshCw
                            className="w-4 h-4 text-slate-600 dark:text-slate-300 transition-transform duration-700 ease-in-out"
                            style={{ transform: `rotate(${rotation}deg)` }}
                        />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                        activeTab === 'all'
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <span>ทั้งหมด</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                        activeTab === 'all' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                        {notifications.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('unread')}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
                        activeTab === 'unread'
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                    <span>ยังไม่ได้อ่าน</span>
                    {unreadItemsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-rose-500 text-white font-bold">
                            {unreadItemsCount}
                        </span>
                    )}
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {isLoading && notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                        <span className="text-sm font-medium">กำลังโหลดการแจ้งเตือน...</span>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-16 flex flex-col items-center px-4">
                        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                            <Bell className="w-7 h-7" />
                        </div>
                        <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                            {activeTab === 'unread' ? 'ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน' : 'ไม่มีการแจ้งเตือนในขณะนี้'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {activeTab === 'unread' ? 'คุณอ่านการแจ้งเตือนทั้งหมดเรียบร้อยแล้ว' : 'เมื่อมีคำร้องหรือกิจกรรมใหม่ ระบบจะแจ้งเตือนคุณที่นี่'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredNotifications.map((notification) => {
                            const meta = getNotificationMeta(notification);
                            const IconComponent = meta.icon;
                            const isUnread = !notification.read;

                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification, meta.link)}
                                    className={`w-full p-4 sm:p-5 text-left transition cursor-pointer flex items-start justify-between gap-4 group ${
                                        isUnread
                                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    }`}
                                >
                                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.iconBg}`}>
                                            <IconComponent className="w-5 h-5" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className={`text-sm font-semibold ${
                                                    isUnread
                                                        ? 'text-slate-900 dark:text-slate-100 font-bold'
                                                        : 'text-slate-700 dark:text-slate-300'
                                                }`}>
                                                    {meta.title}
                                                </h3>
                                                {isUnread && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                        ใหม่
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                                                {notification.message}
                                            </p>

                                            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatDate(notification.createdAt)}
                                                </span>
                                                {meta.link && (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium group-hover:underline inline-flex items-center gap-0.5">
                                                        <span>คลิกเพื่อดูรายละเอียด</span>
                                                        <ChevronRight className="w-3 h-3" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => handleDelete(e, notification.id)}
                                            title="ลบการแจ้งเตือน"
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                                        >
                                            {deletingId === notification.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
