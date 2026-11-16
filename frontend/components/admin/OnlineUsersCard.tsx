'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { useSocket } from '@/contexts/SocketContext';
import {
    Users,
    RefreshCw,
    Radio,
    Shield,
    Car,
    HeartHandshake,
    UserCheck,
    Building2,
    ChevronDown,
    ChevronUp,
    Phone,
    Circle,
} from 'lucide-react';

interface OnlineUser {
    id: string;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    pictureUrl: string | null;
    phone: string | null;
    organization?: {
        id: string;
        name: string;
    } | null;
}

interface OnlineData {
    total: number;
    socketCount?: number;
    byRole: Record<string, number>;
    users: OnlineUser[];
}

const ROLE_META: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    ADMIN: { label: 'ผู้ดูแลระบบ', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: Shield },
    STAFF: { label: 'เจ้าหน้าที่เทศบาล', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: Building2 },
    EXECUTIVE: { label: 'ผู้บริหาร', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', icon: Building2 },
    DRIVE: { label: 'เจ้าหน้าที่รถ', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: Car },
    CAREU: { label: 'จิตอาสาแคร์ยู', bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', icon: HeartHandshake },
    CAREGIVER: { label: 'ผู้ดูแลประชาชน', bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', icon: UserCheck },
    USERS: { label: 'ประชาชน/ผู้รับบริการ', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', icon: Users },
};

export default function OnlineUsersCard() {
    const { socket } = useSocket();
    const [data, setData] = useState<OnlineData>({
        total: 0,
        byRole: {
            USERS: 0,
            CAREGIVER: 0,
            DRIVE: 0,
            CAREU: 0,
            STAFF: 0,
            EXECUTIVE: 0,
            ADMIN: 0,
        },
        users: [],
    });
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [filterRole, setFilterRole] = useState<string>('ALL');

    const fetchOnlineUsers = useCallback(async (showLoading = false) => {
        if (showLoading) setIsRefreshing(true);
        try {
            const res = await fetchWithAuth('/notifications/online-users');
            if (res.ok) {
                const resData = await res.json();
                setData(resData);
            }
        } catch (err) {
            console.error('Fetch online users error:', err);
        } finally {
            setLoading(false);
            if (showLoading) setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOnlineUsers();

        if (socket) {
            const handleCountUpdate = () => {
                fetchOnlineUsers();
            };
            socket.on('online_users_count', handleCountUpdate);
            return () => {
                socket.off('online_users_count', handleCountUpdate);
            };
        }
    }, [socket, fetchOnlineUsers]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchOnlineUsers();
        }, 8000);
        return () => clearInterval(interval);
    }, [fetchOnlineUsers]);

    const filteredUsers = filterRole === 'ALL'
        ? data.users
        : data.users.filter(u => (u.role || 'USERS') === filterRole);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                        <Radio size={22} className="animate-pulse" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            ผู้ใช้งานออนไลน์ขณะนี้ (Live Online Users)
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            ตรวจจับการเชื่อมต่อแบบเรียลไทม์ผ่าน WebSocket
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchOnlineUsers(true)}
                        disabled={isRefreshing}
                        title="รีเฟรชข้อมูลออนไลน์"
                        className="p-2 text-gray-400 hover:text-brand-primary hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>

                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-full text-sm font-bold shadow-sm">
                        <Circle size={8} className="fill-current animate-pulse" />
                        <span>{data.total} คน</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1 mb-4">
                {Object.entries(ROLE_META).map(([roleKey, meta]) => {
                    const count = data.byRole[roleKey] || 0;
                    const Icon = meta.icon;
                    const isSelected = filterRole === roleKey;

                    return (
                        <button
                            key={roleKey}
                            type="button"
                            onClick={() => {
                                setFilterRole(isSelected ? 'ALL' : roleKey);
                                if (!isExpanded) setIsExpanded(true);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                    ? 'ring-2 ring-brand-primary border-brand-primary bg-brand-primary/5'
                                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-gray-700/30'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`p-1 rounded-lg ${meta.bg} ${meta.text}`}>
                                    <Icon size={14} />
                                </span>
                                <span className={`text-base font-extrabold ${count > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {count}
                                </span>
                            </div>
                            <p className="text-[11px] font-medium text-gray-600 dark:text-gray-300 truncate">
                                {meta.label}
                            </p>
                        </button>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/40 dark:hover:bg-gray-700/70 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors flex items-center justify-between cursor-pointer"
            >
                <span>
                    {isExpanded ? 'ซ่อนรายชื่อผู้ใช้ออนไลน์' : `ดูรายชื่อผู้ใช้ออนไลน์ (${data.total} คน)`}
                    {filterRole !== 'ALL' && ` • กรองเฉพาะ ${ROLE_META[filterRole]?.label || filterRole}`}
                </span>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2 max-h-72 overflow-y-auto pr-1">
                    {loading ? (
                        <div className="py-6 text-center text-xs text-gray-400">
                            กำลังโหลดรายชื่อ...
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="py-6 text-center text-xs text-gray-400">
                            ไม่มีผู้ใช้งานออนไลน์ในบทบาทนี้ขณะนี้
                        </div>
                    ) : (
                        filteredUsers.map((u) => {
                            const roleKey = u.role || 'USERS';
                            const meta = ROLE_META[roleKey] || ROLE_META.USERS;
                            const Icon = meta.icon;
                            const displayName = (u.firstName || u.lastName)
                                ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
                                : 'ผู้ใช้งาน';

                            return (
                                <div
                                    key={u.id}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50 hover:border-emerald-200 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative">
                                            {u.pictureUrl ? (
                                                <img
                                                    src={u.pictureUrl}
                                                    alt={displayName}
                                                    className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs border border-brand-primary/20">
                                                    {displayName.slice(0, 1)}
                                                </div>
                                            )}
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {displayName}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                {u.organization?.name && (
                                                    <span className="truncate">{u.organization.name}</span>
                                                )}
                                                {u.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={10} />
                                                        {u.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0 ml-2">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.text}`}>
                                            <Icon size={12} />
                                            <span>{meta.label}</span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
