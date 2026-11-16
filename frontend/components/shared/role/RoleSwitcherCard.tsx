'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Role, RoleRequest } from '@/types/user';
import { ROLE_CONFIGS, getRoleConfig } from '@/lib/role-config';
import { getApiUrl } from '@/lib/api';
import Swal from '@/lib/swal';
import RoleApplyModal from './RoleApplyModal';
import {
    ShieldCheck,
    ArrowRightLeft,
    Clock,
    PlusCircle,
    CheckCircle,
    Car,
    HeartHandshake,
    Users,
    Building2,
    Shield,
    User,
    Award,
    Loader2,
    AlertTriangle,
    XCircle,
} from 'lucide-react';

interface RoleSwitcherCardProps {
    className?: string;
}

export default function RoleSwitcherCard({ className = '' }: RoleSwitcherCardProps) {
    const { user, refreshUser } = useAuth();
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [switchingRole, setSwitchingRole] = useState<Role | null>(null);
    const [myRequests, setMyRequests] = useState<RoleRequest[]>([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);

    const activeRole: Role = (user?.role as Role) || 'USERS';
    const allowedRoles: Role[] = Array.isArray(user?.allowedRoles) && user.allowedRoles.length > 0
        ? (user.allowedRoles as Role[])
        : (user?.role ? [user.role] : ['USERS']);

    const otherRoles = allowedRoles.filter((r) => r !== activeRole);

    const fetchMyRequests = useCallback(async () => {
        if (!user) return;
        setIsLoadingRequests(true);
        try {
            const res = await fetch(`${getApiUrl()}/role-requests/my`, {
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setMyRequests(data || []);
            }
        } catch (err) {
            console.error('Error fetching role requests:', err);
        } finally {
            setIsLoadingRequests(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMyRequests();
    }, [fetchMyRequests]);

    const handleSwitchRole = async (targetRole: Role) => {
        if (targetRole === activeRole) return;

        const targetConfig = getRoleConfig(targetRole);

        const result = await Swal.fire({
            title: `สลับบทบาทไปยัง "${targetConfig.label}" ?`,
            text: 'ระบบจะเปลี่ยนสิทธิ์การเข้าถึงและนำท่านไปยังหน้าหลักของบทบาทใหม่',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันการสลับ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#1E7D55',
            cancelButtonColor: '#6B7280',
        });

        if (!result.isConfirmed) return;

        setSwitchingRole(targetRole);
        try {
            const res = await fetch(`${getApiUrl()}/auth/switch-role`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ role: targetRole }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || 'ไม่สามารถสลับบทบาทได้');
            }

            await refreshUser();

            await Swal.fire({
                icon: 'success',
                title: 'สลับบทบาทสำเร็จ',
                text: `คุณกำลังใช้งานในฐานะ: ${targetConfig.label}`,
                timer: 1500,
                showConfirmButton: false,
            });

            window.location.href = targetConfig.homePath;
        } catch (err: any) {
            console.error('Switch role error:', err);
            Swal.fire({
                icon: 'error',
                title: 'สลับบทบาทไม่สำเร็จ',
                text: err?.message || 'เกิดข้อผิดพลาดในการสลับบทบาท กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setSwitchingRole(null);
        }
    };

    const getRoleIcon = (role: Role) => {
        switch (role) {
            case 'USERS':
                return <User className="w-5 h-5 text-emerald-600" />;
            case 'DRIVE':
                return <Car className="w-5 h-5 text-amber-600" />;
            case 'CAREU':
                return <HeartHandshake className="w-5 h-5 text-purple-600" />;
            case 'CAREGIVER':
                return <Users className="w-5 h-5 text-blue-600" />;
            case 'STAFF':
                return <Building2 className="w-5 h-5 text-indigo-600" />;
            case 'EXECUTIVE':
                return <Award className="w-5 h-5 text-rose-600" />;
            case 'ADMIN':
                return <Shield className="w-5 h-5 text-slate-600" />;
            default:
                return <ShieldCheck className="w-5 h-5 text-gray-600" />;
        }
    };

    const activeConfig = getRoleConfig(activeRole);
    const pendingRequests = myRequests.filter((r) => r.status === 'PENDING');
    const recentResolvedRequests = myRequests
        .filter((r) => r.status === 'REJECTED' || r.status === 'APPROVED')
        .slice(0, 2);

    return (
        <div
            className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden ${className}`}
        >
            <div className="p-4 sm:px-6 sm:py-4 border-b border-gray-100 dark:border-gray-700/80 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                        <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                            บทบาทและสิทธิ์การใช้งาน
                        </h3>
                        <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                            จัดการและสลับบทบาทการใช้งานของบัญชีนี้
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(true)}
                    className="inline-flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm flex-shrink-0 whitespace-nowrap"
                >
                    <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>ขอสิทธิ์เพิ่ม</span>
                </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                <div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                        บทบาทที่กำลังใช้งานอยู่ (Active Role)
                    </span>
                    <div
                        className={`p-4 rounded-xl border ${activeConfig.borderColor} ${activeConfig.bgColor} dark:bg-gray-750 flex items-start justify-between gap-4`}
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                                {getRoleIcon(activeRole)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                                        {activeConfig.label}
                                    </h4>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-600 text-white shadow-xs">
                                        <CheckCircle className="w-3 h-3" />
                                        กำลังใช้งาน
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                    {activeConfig.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {pendingRequests.length > 0 && (
                    <div className="space-y-2">
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                            คำร้องที่อยู่ระหว่างตรวจสอบ
                        </span>
                        {pendingRequests.map((req) => {
                            const reqConfig = getRoleConfig(req.requestedRole);
                            return (
                                <div
                                    key={req.id}
                                    className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
                                        <div>
                                            <span>คำขอสมัครเป็น <strong>{reqConfig.label}</strong></span>
                                            <span className="text-[11px] text-amber-700 dark:text-amber-300/80 block">
                                                ยื่นเมื่อ {new Date(req.createdAt).toLocaleDateString('th-TH')} • ระหว่างนี้ใช้งานบทบาทเดิมได้ตามปกติ
                                            </span>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-full font-medium text-[11px]">
                                        รอตรวจสอบ
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            สลับไปยังบทบาทอื่นที่คุณมีสิทธิ์ ({otherRoles.length})
                        </span>
                    </div>

                    {otherRoles.length === 0 ? (
                        <div className="p-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-center bg-gray-50/50 dark:bg-gray-750/30">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 flex items-center justify-center mx-auto mb-2.5">
                                <ArrowRightLeft className="w-5 h-5" />
                            </div>
                            <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                คุณยังไม่มีบทบาทอื่นที่ได้รับอนุมัติในบัญชีนี้
                            </h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                                หากท่านต้องการใช้งานบทบาทอื่น (เช่น จิตอาสาขับรถ, แคร์ยู, ผู้ดูแล) กรุณากดยื่นขอสิทธิ์เพิ่มเติมเพื่อให้เจ้าหน้าที่ตรวจสอบและอนุมัติ
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsApplyModalOpen(true)}
                                className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                            >
                                <PlusCircle className="w-4 h-4" />
                                <span>ยื่นขอสิทธิ์บทบาทเพิ่มเติม</span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {otherRoles.map((role) => {
                                const config = getRoleConfig(role);
                                const isThisRoleSwitching = switchingRole === role;

                                return (
                                    <div
                                        key={role}
                                        className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition flex flex-col justify-between gap-3 group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/60 flex-shrink-0 group-hover:scale-105 transition-transform">
                                                {getRoleIcon(role)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h5 className="font-bold text-sm text-gray-900 dark:text-white">
                                                    {config.label}
                                                </h5>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                                    {config.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleSwitchRole(role)}
                                                disabled={Boolean(switchingRole)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-emerald-600 text-gray-700 hover:text-white dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-emerald-600 transition disabled:opacity-50"
                                            >
                                                {isThisRoleSwitching ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        <span>กำลังสลับ...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ArrowRightLeft className="w-3.5 h-3.5" />
                                                        <span>สลับไปบทบาทนี้</span>
                                                    </>
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

            <RoleApplyModal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                onSuccess={fetchMyRequests}
                currentAllowedRoles={allowedRoles}
            />
        </div>
    );
}
