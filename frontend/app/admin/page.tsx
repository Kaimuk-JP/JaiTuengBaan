'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/lib/auth';
import {
    Users,
    FileText,
    Settings,
    UserX,
    Radio,
    Shield,
    ShieldCheck,
    Building2,
    ArrowRight,
    RefreshCw,
    Activity,
    Clock,
    LayoutGrid,
    ChevronRight,
    SlidersHorizontal,
    CheckCircle2,
    AlertCircle,
    UserCog,
    Car,
    Heart,
    Crown,
    ExternalLink
} from 'lucide-react';
import OnlineUsersCard from '@/components/admin/OnlineUsersCard';

interface RecentLog {
    id: string;
    category: string;
    action: string;
    note: string | null;
    success: boolean;
    createdAt: string;
    user?: {
        displayName?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        role?: string;
    } | null;
}

const CATEGORY_STYLES: Record<string, { label: string; bg: string; text: string }> = {
    AUTH: { label: 'เข้าสู่ระบบ', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' },
    QUEUE: { label: 'คำร้อง/คิว', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300' },
    JOB: { label: 'จิตอาสา', bg: 'bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300' },
    CAREGIVER: { label: 'ผู้ดูแล', bg: 'bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-300' },
    USER: { label: 'ผู้ใช้', bg: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/40 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-300' },
    VEHICLE: { label: 'รถส่วนกลาง', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300' },
    REWARD: { label: 'ระบบแต้ม', bg: 'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300' },
    SETTING: { label: 'ตั้งค่าระบบ', bg: 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300' },
};

function AdminDashboardContent() {
    const router = useRouter();
    const { user } = useAuth();
    const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [currentTime, setCurrentTime] = useState<string>('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleDateString('th-TH', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                })
            );
        };
        updateClock();
        const timer = setInterval(updateClock, 30000);
        return () => clearInterval(timer);
    }, []);

    const fetchRecentLogs = useCallback(async () => {
        try {
            setLoadingLogs(true);
            const res = await fetchWithAuth('/admin/logs?page=1&limit=4');
            if (res.ok) {
                const data = await res.json();
                setRecentLogs(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch recent admin logs:', err);
        } finally {
            setLoadingLogs(false);
        }
    }, []);

    useEffect(() => {
        fetchRecentLogs();
    }, [fetchRecentLogs]);

    const handleRefreshAll = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchRecentLogs()]);
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const orgName = user?.organization?.name || 'เทศบาล (ไม่ระบุหน่วยงาน)';

    return (
        <div className="min-h-screen bg-slate-50/70 dark:bg-slate-900 pb-16">
            <div className="bg-white/80 dark:bg-slate-850/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-10 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    ศูนย์ควบคุมระบบ (Admin Console)
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                    {orgName}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                สวัสดี, {user?.firstName ? `คุณ${user.firstName}` : 'ผู้ดูแลระบบ'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                {currentTime ? `${currentTime} • ` : ''}ตรวจสอบสถานะแบบเรียลไทม์และจัดการความปลอดภัยของระบบ
                            </p>
                        </div>

                        <div className="flex items-center gap-2 self-start md:self-auto">
                            <button
                                onClick={handleRefreshAll}
                                disabled={isRefreshing}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm cursor-pointer disabled:opacity-50"
                                title="รีเฟรชข้อมูล"
                            >
                                <RefreshCw className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">รีเฟรช</span>
                            </button>

                            <button
                                onClick={() => router.push('/admin/portals')}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm cursor-pointer"
                            >
                                <LayoutGrid className="w-4 h-4 text-indigo-500" />
                                <span>ศูนย์รวม Portal</span>
                            </button>

                            <button
                                onClick={() => router.push('/staff/dashboard')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition hover:shadow cursor-pointer"
                            >
                                <span>Dashboard หลัก</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

                <section>
                    <OnlineUsersCard />
                </section>

                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
                                เมนูควบคุมและจัดการระบบหลัก
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                จัดการสิทธิ์ นโยบายความปลอดภัย และตรวจสอบประวัติการใช้งาน
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                        <div
                            onClick={() => router.push('/admin/roles')}
                            className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-blue-400/60 dark:hover:border-blue-500/60 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                        สิทธิ์การใช้งาน
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    จัดการ Role และสิทธิ์ผู้ใช้งาน
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                    กำหนดระดับการเข้าถึงของผู้ใช้ ปรับสถานะระหว่าง แอดมิน, เจ้าหน้าที่, พนักงานขับรถ, ผู้ดูแล และจิตอาสาแคร์ยู
                                </p>

                                <div className="mt-4 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">ADMIN</span>
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">STAFF</span>
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">DRIVE</span>
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">CAREGIVER</span>
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">CAREU</span>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between text-sm font-semibold text-blue-600 dark:text-blue-400">
                                <span>เข้าสู่หน้าระบบจัดการ Role</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        <div
                            onClick={() => router.push('/admin/logs')}
                            className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-indigo-400/60 dark:hover:border-indigo-500/60 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                        Audit & Security
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    บันทึกกิจกรรมระบบ (Audit Logs)
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                    ตรวจสอบประวัติกิจกรรมย้อนหลัง การล็อกอิน การปรับปรุงข้อมูลคิว และบันทึกการกระทำที่สำคัญ
                                </p>

                                <div className="mt-4 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                                    {loadingLogs ? (
                                        <div className="py-2 text-center text-xs text-slate-400">กำลังโหลดประวัติล่าสุด...</div>
                                    ) : recentLogs.length > 0 ? (
                                        recentLogs.slice(0, 2).map((log) => {
                                            const cat = CATEGORY_STYLES[log.category] || { label: log.category, bg: 'bg-slate-100', text: 'text-slate-700' };
                                            return (
                                                <div key={log.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 dark:bg-slate-900/60">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${cat.bg} ${cat.text}`}>
                                                        {cat.label}
                                                    </span>
                                                    <span className="text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                                                        {log.action}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-xs text-slate-400 py-1">ยังไม่มีบันทึกกิจกรรมล่าสุด</div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                <span>เปิดดูประวัติกิจกรรมทั้งหมด</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        <div
                            onClick={() => router.push('/admin/delete-users')}
                            className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-rose-400/60 dark:hover:border-rose-500/60 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <UserX className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                        ความปลอดภัยบัญชี
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                    ลบบัญชีและบริหารความปลอดภัย
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                    จัดการลบบัญชีที่ไม่ได้ใช้งาน ลบข้อมูลผู้ใช้แบบปลอดภัย (Soft-delete & Confirmation) และควบคุมสิทธิ์การเก็บรักษาข้อมูล
                                </p>

                                <div className="mt-4 p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                                    <span>ต้องใช้สิทธิ์แอดมินสูงสุดในการดำเนินการลบบัญชี</span>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between text-sm font-semibold text-rose-600 dark:text-rose-400">
                                <span>เข้าสู่ระบบจัดการบัญชี</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        <div
                            onClick={() => router.push('/admin/portals')}
                            className="group bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 border border-slate-700 shadow-md hover:shadow-xl hover:border-emerald-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between md:col-span-2 lg:col-span-2"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center">
                                            <LayoutGrid className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                                ศูนย์กลางนโยบาย (Policy & Portals)
                                            </span>
                                            <h3 className="text-lg font-bold text-white mt-1">
                                                การตั้งค่านโยบายและศูนย์รวมพอร์ทัล
                                            </h3>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                                    สลับเข้าใช้งานระหว่าง Portal พนักงานขับรถ, จิตอาสาแคร์ยู, ผู้ดูแลประชาชน และตั้งค่านโยบายการล็อกพิกัดสำนักงาน (Geofence radius), ระยะเวลายกเลิกคำร้อง และการจำกัดคิวล่วงหน้า
                                </p>

                                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-700/80">
                                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                                        <span className="text-[11px] text-slate-400 block">พอร์ทัลรถ</span>
                                        <span className="text-xs font-semibold text-emerald-400">Driver Portal</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                                        <span className="text-[11px] text-slate-400 block">พอร์ทัลจิตอาสา</span>
                                        <span className="text-xs font-semibold text-rose-400">CareU Portal</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                                        <span className="text-[11px] text-slate-400 block">นโยบายพิกัด</span>
                                        <span className="text-xs font-semibold text-amber-400">Office Radius</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                                        <span className="text-[11px] text-slate-400 block">นโยบายยกเลิก</span>
                                        <span className="text-xs font-semibold text-blue-400">Cancel Rules</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between text-sm font-semibold text-emerald-400">
                                <span>เปิดศูนย์รวมพอร์ทัลและการตั้งค่านโยบาย</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                            ข้อมูลผู้ดูแลระบบ
                                        </h3>
                                        <p className="text-xs text-slate-500">Security & Session</p>
                                    </div>
                                </div>

                                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                                        <span className="text-slate-400">ชื่อผู้ใช้งาน:</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                                            {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (user?.displayName || 'ไม่ระบุ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                                        <span className="text-slate-400">สิทธิ์ในระบบ:</span>
                                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                                            {user?.role || 'ADMIN'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                                        <span className="text-slate-400">สถานะเซสชัน:</span>
                                        <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> เชื่อมต่อปลอดภัย
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                                <span>Platform: ใจส่งถึงบ้าน</span>
                                <span className="font-mono text-[10px]">v2.0-secure</span>
                            </div>
                        </div>

                    </div>
                </section>

            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboardContent />
        </ProtectedRoute>
    );
}
