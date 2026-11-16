'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RoleRequest, RoleRequestStatus } from '@/types/user';
import { getRoleConfig } from '@/lib/role-config';
import { fetchWithAuth } from '@/lib/auth';
import { useSocket, Notification } from '@/contexts/SocketContext';
import Swal from '@/lib/swal';
import {
    Search,
    Filter,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    Car,
    HeartHandshake,
    Users,
    Building2,
    Shield,
    Calendar,
    ChevronRight,
    Loader2,
    RefreshCw,
    Phone,
    CreditCard,
    History,
} from 'lucide-react';

export default function RoleRequestList() {
    const router = useRouter();
    const { socket } = useSocket();
    const [requests, setRequests] = useState<RoleRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [rotation, setRotation] = useState(0);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('status', 'PENDING');
            if (roleFilter !== 'ALL') params.append('role', roleFilter);
            if (searchQuery.trim()) params.append('search', searchQuery.trim());

            const res = await fetchWithAuth(`/role-requests?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setRequests(data.data || []);
            }
        } catch (err) {
            console.error('Error fetching role requests:', err);
        } finally {
            setLoading(false);
        }
    }, [roleFilter, searchQuery]);

    const handleRefresh = async () => {
        setRotation((prev) => prev + 360);
        try {
            await fetchRequests();
        } catch (err) {
            console.error('Refresh error:', err);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    useEffect(() => {
        if (!socket) return;
        const handleNotification = (notif: Notification) => {
            if (notif.type?.includes('ROLE_REQUEST')) {
                fetchRequests();
            }
        };
        socket.on('notification', handleNotification);
        return () => {
            socket.off('notification', handleNotification);
        };
    }, [socket, fetchRequests]);

    const getStatusBadge = (status: RoleRequestStatus) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        รอตรวจสอบ
                    </span>
                );
            case 'APPROVED':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        อนุมัติแล้ว
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                        <XCircle className="w-3.5 h-3.5" />
                        ปฏิเสธ
                    </span>
                );
            default:
                return null;
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'DRIVE':
                return <Car className="w-4 h-4 text-amber-600" />;
            case 'CAREU':
                return <HeartHandshake className="w-4 h-4 text-purple-600" />;
            case 'CAREGIVER':
                return <Users className="w-4 h-4 text-blue-600" />;
            case 'STAFF':
                return <Building2 className="w-4 h-4 text-indigo-600" />;
            default:
                return <Shield className="w-4 h-4 text-gray-600" />;
        }
    };

    const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ค้นหาชื่อ, เบอร์โทร, เลขบัตร..."
                            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
                        >
                            <option value="ALL">บทบาททั้งหมด</option>
                            <option value="DRIVE">จิตอาสาขับรถ (DRIVE)</option>
                            <option value="CAREU">จิตอาสาแคร์ยู (CAREU)</option>
                            <option value="CAREGIVER">ผู้ดูแลประชาชน (CAREGIVER)</option>
                            <option value="STAFF">เจ้าหน้าที่เทศบาล (STAFF)</option>
                        </select>

                        <button
                            type="button"
                            onClick={handleRefresh}
                            title="รีเฟรช"
                            className="p-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition flex-shrink-0 active:scale-95 cursor-pointer"
                        >
                            <RefreshCw
                                className="w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-700 ease-in-out"
                                style={{ transform: `rotate(${rotation}deg)` }}
                            />
                        </button>

                        <Link
                            href="/staff/reports?tab=history"
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 transition flex-shrink-0 whitespace-nowrap"
                        >
                            <History className="w-4 h-4 text-slate-500" />
                            <span>ดูประวัติคำร้อง</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                        <span className="text-sm font-medium">กำลังโหลดรายการคำร้อง...</span>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="py-16 text-center text-gray-500 px-4">
                        <Clock className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
                        <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                            ไม่มีคำร้องที่รอตรวจสอบในขณะนี้
                        </p>
                        <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                            รายการคำร้องที่ได้รับการอนุมัติหรือปฏิเสธแล้ว สามารถตรวจสอบได้ที่หน้าประวัติคำร้อง
                        </p>
                        <Link
                            href="/staff/reports?tab=history"
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition border border-emerald-200 dark:border-emerald-800/40"
                        >
                            <History className="w-4 h-4" />
                            <span>ไปที่หน้าประวัติคำร้อง</span>
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {requests.map((req) => {
                            const reqConfig = getRoleConfig(req.requestedRole);
                            const currentConfig = getRoleConfig(req.currentRole);
                            const userFullName = `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || 'ไม่ระบุชื่อ';

                            return (
                                <div
                                    key={req.id}
                                    onClick={() => router.push(`/staff/role/${req.id}`)}
                                    className="p-5 hover:bg-gray-50/80 dark:hover:bg-gray-750/50 transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                                >
                                    <div className="flex items-start gap-3.5 min-w-0">
                                        <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-base flex-shrink-0 border border-emerald-200 dark:border-emerald-800">
                                            {req.user?.pictureUrl ? (
                                                <img
                                                    src={req.user.pictureUrl}
                                                    alt={userFullName}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                userFullName.charAt(0) || 'U'
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition">
                                                    {userFullName}
                                                </h4>
                                                {getStatusBadge(req.status)}
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                    {req.user?.phone || '-'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                                                    {req.user?.idCard || '-'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    {new Date(req.createdAt).toLocaleDateString('th-TH', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>

                                            {req.reason && (
                                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 line-clamp-1 italic bg-gray-50 dark:bg-gray-700/40 px-2.5 py-1 rounded-md border border-gray-100 dark:border-gray-700">
                                                    "{req.reason}"
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-gray-700">
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400">ขอบทบาท:</div>
                                            <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900 dark:text-white mt-0.5">
                                                {getRoleIcon(req.requestedRole)}
                                                <span>{reqConfig.label}</span>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/staff/role/${req.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-600 transition flex items-center gap-1 shadow-xs"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>ตรวจสอบ</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>
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
