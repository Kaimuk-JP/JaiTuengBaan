'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { fetchWithAuth } from '@/lib/auth';
import { useSocket } from '@/contexts/SocketContext';
import {
    Radio,
    RefreshCw,
    Search,
    Users,
    Building2,
    Shield,
    Car,
    HeartHandshake,
    UserCheck,
    Phone,
    Circle,
    ArrowLeft,
    Activity,
    Smartphone,
    User as UserIcon,
} from 'lucide-react';
import Link from 'next/link';

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

const ROLE_META: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
    ADMIN: { label: 'ผู้ดูแลระบบ', bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', icon: Shield },
    STAFF: { label: 'เจ้าหน้าที่เทศบาล', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', icon: Building2 },
    EXECUTIVE: { label: 'ผู้บริหาร', bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', icon: Building2 },
    DRIVE: { label: 'เจ้าหน้าที่รถ', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', icon: Car },
    CAREU: { label: 'จิตอาสาแคร์ยู', bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', icon: HeartHandshake },
    CAREGIVER: { label: 'ผู้ดูแลประชาชน', bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800', icon: UserCheck },
    USERS: { label: 'ประชาชน / ผู้ใช้บริการ', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', icon: Users },
};

function OnlineUsersDashboard() {
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
    const [filterRole, setFilterRole] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchOnlineUsers = useCallback(async (showLoading = false) => {
        if (showLoading) setIsRefreshing(true);
        try {
            const res = await fetchWithAuth('/notifications/online-users');
            if (res.ok) {
                const resData = await res.json();
                setData(resData);
                setLastUpdated(new Date());
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
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            fetchOnlineUsers();
        }, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchOnlineUsers]);

    const filteredUsers = useMemo(() => {
        return data.users.filter(u => {
            const roleMatch = filterRole === 'ALL' || (u.role || 'USERS') === filterRole;
            if (!roleMatch) return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
            const phone = u.phone ? u.phone.toLowerCase() : '';
            const orgName = u.organization?.name ? u.organization.name.toLowerCase() : '';

            return fullName.includes(q) || phone.includes(q) || orgName.includes(q);
        });
    }, [data.users, filterRole, searchQuery]);

    const staffCount = (data.byRole.STAFF || 0) + (data.byRole.ADMIN || 0) + (data.byRole.EXECUTIVE || 0);
    const volunteerCount = (data.byRole.DRIVE || 0) + (data.byRole.CAREU || 0);
    const citizenCount = (data.byRole.USERS || 0) + (data.byRole.CAREGIVER || 0);

    return (
        <div className="w-full min-h-screen bg-slate-50/70 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-800 shadow-sm shrink-0">
                                <Radio size={26} className="animate-pulse" />
                                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                                        ผู้ใช้งานออนไลน์ (Live Active Users)
                                    </h1>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <Circle size={6} className="fill-current text-emerald-500 animate-pulse" />
                                        <span>กำลังเชื่อมต่อ Real-time</span>
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                                    ตรวจจับสถานะผู้ใช้งานที่กำลังเปิดระบบสดผ่าน WebSocket Socket.io
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-2.5 sm:self-center self-start">
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                                    autoRefresh
                                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-xs'
                                        : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-600'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                                <span>{autoRefresh ? 'Live Auto (5วิ)' : 'Auto: ปิด'}</span>
                            </button>

                            <button
                                onClick={() => fetchOnlineUsers(true)}
                                disabled={isRefreshing}
                                className="py-2 px-3.5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 hover:border-brand-primary text-slate-700 dark:text-gray-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                            >
                                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                                <span>รีเฟรช</span>
                            </button>

                            <Link
                                href="/admin"
                                className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 text-xs font-medium rounded-xl transition-colors flex items-center gap-1"
                            >
                                <ArrowLeft size={14} />
                                <span>กลับเมนู Admin</span>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-gray-400">ออนไลน์ทั้งหมดขณะนี้</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">{data.total}</span>
                                        <span className="text-xs font-semibold text-slate-400">คน</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">เซสชันที่เชื่อมต่อสดในระบบ</p>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl text-emerald-600 border border-emerald-100">
                                    <Radio size={28} className="animate-pulse" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600"></div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-blue-200/80 dark:border-blue-900/40 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-gray-400">เจ้าหน้าที่ & ผู้บริหาร</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">{staffCount}</span>
                                        <span className="text-xs font-semibold text-slate-400">คน</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">Admin: {data.byRole.ADMIN || 0} | Staff: {data.byRole.STAFF || 0}</p>
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-blue-600 border border-blue-100">
                                    <Building2 size={28} />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-amber-200/80 dark:border-amber-900/40 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-gray-400">จิตอาสาขับรถ & แคร์ยู</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">{volunteerCount}</span>
                                        <span className="text-xs font-semibold text-slate-400">คน</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">คนขับ: {data.byRole.DRIVE || 0} | แคร์ยู: {data.byRole.CAREU || 0}</p>
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-2xl text-amber-600 border border-amber-100">
                                    <Car size={28} />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-teal-200/80 dark:border-teal-900/40 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-gray-400">ประชาชน & ผู้ดูแล</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-3xl sm:text-4xl font-black text-teal-600 dark:text-teal-400">{citizenCount}</span>
                                        <span className="text-xs font-semibold text-slate-400">คน</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">ผู้รับบริการ: {data.byRole.USERS || 0} | ผู้ดูแล: {data.byRole.CAREGIVER || 0}</p>
                                </div>
                                <div className="p-3 bg-teal-50 dark:bg-teal-950/50 rounded-2xl text-teal-600 border border-teal-100">
                                    <Users size={28} />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-500"></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-200/80 dark:border-gray-700 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setFilterRole('ALL')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                    filterRole === 'ALL'
                                        ? 'bg-brand-primary text-white shadow-sm'
                                        : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                <span>ทั้งหมด</span>
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${filterRole === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-gray-600 text-slate-700 dark:text-gray-200'}`}>
                                    {data.total}
                                </span>
                            </button>

                            {Object.entries(ROLE_META).map(([roleKey, meta]) => {
                                const count = data.byRole[roleKey] || 0;
                                const isSelected = filterRole === roleKey;
                                const Icon = meta.icon;

                                return (
                                    <button
                                        key={roleKey}
                                        type="button"
                                        onClick={() => setFilterRole(roleKey)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
                                            isSelected
                                                ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                                                : `${meta.bg} ${meta.text} ${meta.border} hover:opacity-90`
                                        }`}
                                    >
                                        <Icon size={14} />
                                        <span>{meta.label}</span>
                                        <span className={`px-2 py-0.2 rounded-full text-[11px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-white/90 dark:bg-gray-800'}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ค้นหาตามชื่อ-นามสกุล, เบอร์โทรศัพท์, หรือชื่อเทศบาล..."
                                className="w-full pl-11 pr-20 py-3 bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-600 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    ล้างคำค้น
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <Activity size={18} className="text-emerald-500" />
                                <h2 className="text-base font-bold text-slate-800 dark:text-white">
                                    รายชื่อผู้ใช้งานที่กำลังเชื่อมต่อ ({filteredUsers.length} คน)
                                </h2>
                            </div>
                            <span className="text-xs text-slate-400">
                                อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH')}
                            </span>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center text-slate-400">
                                <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-brand-primary" />
                                <p className="text-sm font-medium">กำลังโหลดข้อมูลผู้ใช้งานออนไลน์...</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="py-20 text-center text-slate-400">
                                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3 text-slate-300 dark:text-gray-500">
                                    <Radio size={32} />
                                </div>
                                <p className="text-base font-bold text-slate-700 dark:text-gray-200">
                                    ไม่พบผู้ใช้งานออนไลน์ในเงื่อนไขนี้
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {data.total === 0 ? 'ขณะนี้ยังไม่มีผู้ใช้งานเปิดระบบเชื่อมต่ออยู่' : 'ลองเปลี่ยนคำค้นหาหรือตัวกรองบทบาท'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-gray-700/60">
                                {filteredUsers.map((u) => {
                                    const roleKey = u.role || 'USERS';
                                    const meta = ROLE_META[roleKey] || ROLE_META.USERS;
                                    const Icon = meta.icon;
                                    const displayName = (u.firstName || u.lastName)
                                        ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
                                        : 'ผู้ใช้งานระบบ';

                                    return (
                                        <div
                                            key={u.id}
                                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-gray-700/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="relative flex-shrink-0">
                                                    {u.pictureUrl ? (
                                                        <img
                                                            src={u.pictureUrl}
                                                            alt={displayName}
                                                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 dark:border-gray-600 shadow-xs"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm border-2 border-brand-primary/20">
                                                            {displayName.slice(0, 1)}
                                                        </div>
                                                    )}
                                                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full shadow-xs"></span>
                                                </div>

                                                <div className="min-w-0 space-y-1">
                                                    <div className="flex items-center gap-2.5 flex-wrap">
                                                        <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-white truncate">
                                                            {displayName}
                                                        </p>
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                                                            <Circle size={6} className="fill-current animate-pulse" />
                                                            Online
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-gray-400 flex-wrap">
                                                        {u.organization?.name && (
                                                            <span className="flex items-center gap-1 text-slate-600 dark:text-gray-300">
                                                                <Building2 size={13} className="text-slate-400" />
                                                                {u.organization.name}
                                                            </span>
                                                        )}
                                                        {u.phone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone size={13} className="text-slate-400" />
                                                                {u.phone}
                                                            </span>
                                                        )}
                                                        <span className="text-slate-400">ID: {u.id.slice(-8)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 sm:self-center self-start shrink-0">
                                                <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border ${meta.bg} ${meta.text} ${meta.border}`}>
                                                    <Icon size={15} />
                                                    <span>{meta.label}</span>
                                                </span>
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

export default function OnlineUsersPage() {
    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <OnlineUsersDashboard />
        </ProtectedRoute>
    );
}
