'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { logout, fetchWithAuth } from '@/lib/auth';
import Swal from 'sweetalert2';
import {
    Shield,
    ShieldCheck,
    Building2,
    Car,
    HeartHandshake,
    Users,
    UserCheck,
    Settings,
    Radio,
    FileText,
    CalendarDays,
    Clock,
    Lock,
    MapPin,
    ArrowRight,
    ExternalLink,
    LogOut,
    Sparkles,
    CheckCircle2,
    SlidersHorizontal,
    LayoutGrid,
    ChevronRight,
    RefreshCw,
    MessageSquare,
    Activity
} from 'lucide-react';
import OnlineUsersCard from '@/components/admin/OnlineUsersCard';

export default function AdminPortalSelection() {
    const { user } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'all' | 'portals' | 'policies' | 'monitor'>('all');

    const [lockReturnOfficeEnabled, setLockReturnOfficeEnabled] = useState(false);
    const [returnOfficeRadiusMeters, setReturnOfficeRadiusMeters] = useState(200);
    const [allowUserCancelQueue, setAllowUserCancelQueue] = useState(true);
    const [cancelQueueUnit, setCancelQueueUnit] = useState<'DAYS' | 'HOURS'>('DAYS');
    const [cancelQueueValue, setCancelQueueValue] = useState<number>(1);
    const [customUserCancelInput, setCustomUserCancelInput] = useState<string>('1');
    const [allowVolunteerCancelJob, setAllowVolunteerCancelJob] = useState(true);
    const [volunteerCancelUnit, setVolunteerCancelUnit] = useState<'DAYS' | 'HOURS'>('DAYS');
    const [volunteerCancelValue, setVolunteerCancelValue] = useState<number>(1);
    const [customVolunteerCancelInput, setCustomVolunteerCancelInput] = useState<string>('1');
    const [isSavingVolunteerCancelSetting, setIsSavingVolunteerCancelSetting] = useState(false);
    const [advanceBookingLimitEnabled, setAdvanceBookingLimitEnabled] = useState(true);
    const [advanceBookingUnit, setAdvanceBookingUnit] = useState<'DAYS' | 'HOURS'>('DAYS');
    const [advanceBookingValue, setAdvanceBookingValue] = useState<number>(1);
    const [customAdvanceInput, setCustomAdvanceInput] = useState<string>('1');
    const [lineNotificationEnabled, setLineNotificationEnabled] = useState(true);
    const [isSavingLineNotificationSetting, setIsSavingLineNotificationSetting] = useState(false);
    const [orgData, setOrgData] = useState<{ name?: string; lat?: number | null; lng?: number | null } | null>(null);
    const [isLoadingSetting, setIsLoadingSetting] = useState(true);
    const [isSavingSetting, setIsSavingSetting] = useState(false);
    const [isSavingCancelSetting, setIsSavingCancelSetting] = useState(false);
    const [isSavingAdvanceBookingSetting, setIsSavingAdvanceBookingSetting] = useState(false);

    useEffect(() => {
        fetchLockSetting();
        fetchCancelSetting();
        fetchVolunteerCancelSetting();
        fetchAdvanceBookingSetting();
        fetchLineNotificationSetting();
    }, []);

    const fetchLineNotificationSetting = async () => {
        try {
            const res = await fetchWithAuth('/settings/line-notification-enabled');
            if (res.ok) {
                const data = await res.json();
                setLineNotificationEnabled(data.lineNotificationEnabled ?? true);
            }
        } catch (err) {
            console.error('Error fetching line notification setting:', err);
        }
    };

    const handleToggleLineNotification = async () => {
        const nextVal = !lineNotificationEnabled;
        setIsSavingLineNotificationSetting(true);
        try {
            const res = await fetchWithAuth('/settings/line-notification-enabled', {
                method: 'PUT',
                body: JSON.stringify({ enabled: nextVal, applyToAll: true }),
            });
            if (res.ok) {
                setLineNotificationEnabled(nextVal);
                Swal.fire({
                    icon: 'success',
                    title: nextVal ? 'เปิดระบบแจ้งเตือนผ่าน LINE แล้ว (ทุกเทศบาล)' : 'ปิดระบบแจ้งเตือนผ่าน LINE แล้ว (ทุกเทศบาล)',
                    text: nextVal
                        ? 'ระบบจะส่งข้อความแจ้งเตือนผ่าน LINE และแนะนำให้ประชาชนผูกบัญชี LINE'
                        : 'ระบบจะไม่ส่งข้อความแจ้งเตือนผ่าน LINE และปิดการแนะนำผูกบัญชี LINE ทั่วทั้งระบบ',
                    timer: 2500,
                    showConfirmButton: false,
                });
            }
        } catch (err) {
            console.error('Error saving line notification setting:', err);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกการตั้งค่าได้',
            });
        } finally {
            setIsSavingLineNotificationSetting(false);
        }
    };

    const fetchAdvanceBookingSetting = async () => {
        try {
            const res = await fetchWithAuth('/settings/advance-booking');
            if (res.ok) {
                const data = await res.json();
                setAdvanceBookingLimitEnabled(data.advanceBookingLimitEnabled ?? true);
                const unit = data.advanceBookingUnit || 'DAYS';
                const val = data.advanceBookingValue ?? data.minAdvanceBookingDays ?? 1;
                setAdvanceBookingUnit(unit);
                setAdvanceBookingValue(val);
                setCustomAdvanceInput(String(val));
            }
        } catch (err) {
            console.error('Error fetching advance booking setting:', err);
        }
    };

    const handleToggleAdvanceBookingLimit = async () => {
        const nextVal = !advanceBookingLimitEnabled;
        setIsSavingAdvanceBookingSetting(true);
        try {
            const res = await fetchWithAuth('/settings/advance-booking', {
                method: 'PUT',
                body: JSON.stringify({
                    advanceBookingLimitEnabled: nextVal,
                    advanceBookingUnit,
                    advanceBookingValue,
                    applyToAll: true,
                }),
            });
            if (res.ok) {
                setAdvanceBookingLimitEnabled(nextVal);
                const notice = advanceBookingUnit === 'DAYS'
                    ? (advanceBookingValue === 1 ? '1 วัน (เริ่มจองได้ตั้งแต่วันถัดไป)' : `${advanceBookingValue} วัน`)
                    : `${advanceBookingValue} ชั่วโมง`;
                Swal.fire({
                    icon: 'success',
                    title: nextVal ? 'เปิดการจำกัดเวลาจองล่วงหน้า (ทุกเทศบาล)' : 'ปิดการจำกัดเวลาจองล่วงหน้า (ทุกเทศบาล)',
                    text: nextVal
                        ? `ประชาชนต้องจองคิวก่อนเวลานัดหมายอย่างน้อย ${notice}`
                        : 'ประชาชนสามารถจองคิววันเดียวกันได้ทันทีโดยไม่จำกัดเวลาล่วงหน้า',
                    timer: 2500,
                    showConfirmButton: false,
                });
            }
        } catch (err) {
            console.error('Error saving advance booking setting:', err);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกการตั้งค่าได้',
            });
        } finally {
            setIsSavingAdvanceBookingSetting(false);
        }
    };

    const handleSaveAdvanceBooking = async (unit: 'DAYS' | 'HOURS', val: number) => {
        setAdvanceBookingUnit(unit);
        setAdvanceBookingValue(val);
        setCustomAdvanceInput(String(val));
        try {
            await fetchWithAuth('/settings/advance-booking', {
                method: 'PUT',
                body: JSON.stringify({
                    advanceBookingLimitEnabled,
                    advanceBookingUnit: unit,
                    advanceBookingValue: val,
                    applyToAll: true,
                }),
            });
        } catch (err) {
            console.error('Error updating advance booking:', err);
        }
    };

    const fetchCancelSetting = async () => {
        try {
            const res = await fetchWithAuth('/settings/queue-cancellation');
            if (res.ok) {
                const data = await res.json();
                setAllowUserCancelQueue(data.allowUserCancelQueue ?? true);
                const unit = data.cancelQueueUnit || 'DAYS';
                const val = data.cancelQueueValue ?? 1;
                setCancelQueueUnit(unit);
                setCancelQueueValue(val);
                setCustomUserCancelInput(String(val));
            }
        } catch (err) {
            console.error('Error fetching cancel setting:', err);
        }
    };

    const handleSaveQueueCancelSetting = async (unit: 'DAYS' | 'HOURS', val: number) => {
        setCancelQueueUnit(unit);
        setCancelQueueValue(val);
        setCustomUserCancelInput(String(val));
        try {
            await fetchWithAuth('/settings/queue-cancellation', {
                method: 'PUT',
                body: JSON.stringify({
                    allowUserCancelQueue,
                    cancelQueueUnit: unit,
                    cancelQueueValue: val,
                    applyToAll: true,
                }),
            });
        } catch (err) {
            console.error('Error updating queue cancel setting:', err);
        }
    };

    const handleToggleAllowUserCancelQueue = async () => {
        const nextVal = !allowUserCancelQueue;
        setIsSavingCancelSetting(true);
        try {
            const res = await fetchWithAuth('/settings/queue-cancellation', {
                method: 'PUT',
                body: JSON.stringify({
                    allowUserCancelQueue: nextVal,
                    cancelQueueUnit,
                    cancelQueueValue,
                    applyToAll: true,
                }),
            });
            if (res.ok) {
                setAllowUserCancelQueue(nextVal);
                const desc = cancelQueueUnit === 'DAYS'
                    ? (cancelQueueValue === 1 ? '1 วันก่อนวันเริ่มงาน' : `${cancelQueueValue} วันก่อนวันเริ่มงาน`)
                    : `${cancelQueueValue} ชั่วโมงก่อนเวลานัดหมาย`;
                Swal.fire({
                    icon: 'success',
                    title: nextVal ? 'เปิดการยกเลิกคิว (ทุกเทศบาล)' : 'ปิดการยกเลิกคิว (ทุกเทศบาล)',
                    text: nextVal
                        ? `ประชาชนสามารถกดยกเลิกคิวก่อนเวลานัดหมายอย่างน้อย ${desc}`
                        : 'ประชาชนไม่สามารถกดยกเลิกคิวเองได้ (ต้องติดต่อเทศบาลเท่านั้น)',
                    timer: 2500,
                    showConfirmButton: false,
                });
            }
        } catch (err) {
            console.error('Error saving cancel setting:', err);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกการตั้งค่าได้',
            });
        } finally {
            setIsSavingCancelSetting(false);
        }
    };

    const fetchVolunteerCancelSetting = async () => {
        try {
            const res = await fetchWithAuth('/settings/volunteer-cancellation');
            if (res.ok) {
                const data = await res.json();
                setAllowVolunteerCancelJob(data.allowVolunteerCancelJob ?? true);
                const unit = data.volunteerCancelUnit || 'DAYS';
                const val = data.volunteerCancelValue ?? 1;
                setVolunteerCancelUnit(unit);
                setVolunteerCancelValue(val);
                setCustomVolunteerCancelInput(String(val));
            }
        } catch (err) {
            console.error('Error fetching volunteer cancel setting:', err);
        }
    };

    const handleSaveVolunteerCancelSetting = async (unit: 'DAYS' | 'HOURS', val: number) => {
        setVolunteerCancelUnit(unit);
        setVolunteerCancelValue(val);
        setCustomVolunteerCancelInput(String(val));
        try {
            await fetchWithAuth('/settings/volunteer-cancellation', {
                method: 'PUT',
                body: JSON.stringify({
                    allowVolunteerCancelJob,
                    volunteerCancelUnit: unit,
                    volunteerCancelValue: val,
                    applyToAll: true,
                }),
            });
        } catch (err) {
            console.error('Error updating volunteer cancel setting:', err);
        }
    };

    const handleToggleAllowVolunteerCancelJob = async () => {
        const nextVal = !allowVolunteerCancelJob;
        setIsSavingVolunteerCancelSetting(true);
        try {
            const res = await fetchWithAuth('/settings/volunteer-cancellation', {
                method: 'PUT',
                body: JSON.stringify({
                    allowVolunteerCancelJob: nextVal,
                    volunteerCancelUnit,
                    volunteerCancelValue,
                    applyToAll: true,
                }),
            });
            if (res.ok) {
                setAllowVolunteerCancelJob(nextVal);
                const desc = volunteerCancelUnit === 'DAYS'
                    ? (volunteerCancelValue === 1 ? '1 วันก่อนวันเริ่มงาน' : `${volunteerCancelValue} วันก่อนวันเริ่มงาน`)
                    : `${volunteerCancelValue} ชั่วโมงก่อนเวลานัดหมาย`;
                Swal.fire({
                    icon: 'success',
                    title: nextVal ? 'เปิดการยกเลิกงานของคนขับ/แคร์ยู (ทุกเทศบาล)' : 'ปิดการยกเลิกงานของคนขับ/แคร์ยู (ทุกเทศบาล)',
                    text: nextVal
                        ? `คนขับและแคร์ยูสามารถกดยกเลิกงานก่อนเวลานัดหมายอย่างน้อย ${desc}`
                        : 'คนขับและแคร์ยูไม่สามารถกดยกเลิกงานเองได้ (ต้องติดต่อเทศบาลเท่านั้น)',
                    timer: 2500,
                    showConfirmButton: false,
                });
            }
        } catch (err) {
            console.error('Error saving volunteer cancel setting:', err);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกการตั้งค่าได้',
            });
        } finally {
            setIsSavingVolunteerCancelSetting(false);
        }
    };

    const fetchLockSetting = async () => {
        try {
            const res = await fetchWithAuth('/settings/lock-return-office');
            if (res.ok) {
                const data = await res.json();
                setLockReturnOfficeEnabled(data.lockReturnOfficeEnabled ?? false);
                setReturnOfficeRadiusMeters(data.returnOfficeRadiusMeters ?? 200);
                setOrgData({ lat: data.lat, lng: data.lng });
            }
        } catch (err) {
            console.error('Error fetching lock setting:', err);
        } finally {
            setIsLoadingSetting(false);
        }
    };

    const handleToggleLockReturnOffice = async () => {
        const nextVal = !lockReturnOfficeEnabled;
        setIsSavingSetting(true);
        try {
            const res = await fetchWithAuth('/settings/lock-return-office', {
                method: 'PUT',
                body: JSON.stringify({ enabled: nextVal, radiusMeters: returnOfficeRadiusMeters, applyToAll: true }),
            });
            if (res.ok) {
                setLockReturnOfficeEnabled(nextVal);
                Swal.fire({
                    icon: 'success',
                    title: nextVal ? 'เปิดการล็อคปุ่มแล้ว (ทุกเทศบาล)' : 'ปิดการล็อคปุ่มแล้ว (ทุกเทศบาล)',
                    text: nextVal
                        ? `ปุ่มจะล็อคจนกว่าคนขับจะเข้ามาในรัศมี ${returnOfficeRadiusMeters} เมตรรอบเทศบาล`
                        : 'คนขับสามารถกดนำรถกลับถึงเทศบาลได้โดยไม่ตรวจจับรัศมี GPS',
                    timer: 2500,
                    showConfirmButton: false,
                });
            }
        } catch (err) {
            console.error('Error saving lock setting:', err);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกการตั้งค่าได้',
            });
        } finally {
            setIsSavingSetting(false);
        }
    };

    const handleUpdateRadius = async (radius: number) => {
        setReturnOfficeRadiusMeters(radius);
        try {
            await fetchWithAuth('/settings/lock-return-office', {
                method: 'PUT',
                body: JSON.stringify({ enabled: lockReturnOfficeEnabled, radiusMeters: radius, applyToAll: true }),
            });
        } catch (err) {
            console.error('Error updating radius:', err);
        }
    };

    const portalCategories = [
        {
            categoryName: 'ฝ่ายบริหารจัดการและเจ้าหน้าที่ (Management & Staff)',
            categoryDesc: 'แผงควบคุมหลักสำหรับอนุมัติคำขอ จัดตารางรถ และตั้งค่าระบบ',
            items: [
                {
                    title: 'หน้าจอเจ้าหน้าที่ (เทศบาล/Admin)',
                    desc: 'แผงควบคุมหลักสำหรับจัดการคำขอ จัดสรรรถ และติดตามงานทั้งหมด',
                    roleBadge: 'Staff / Admin',
                    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
                    gradient: 'from-blue-600 to-indigo-600',
                    iconBg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
                    icon: Building2,
                    path: '/staff/dashboard',
                },
                {
                    title: 'หน้าจอผู้อนุมัติ / ผู้บริหาร (Executive)',
                    desc: 'ตรวจสอบและอนุมัติคำร้องขอใช้บริการคิวรถในมุมมองผู้บริหาร',
                    roleBadge: 'Executive',
                    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
                    gradient: 'from-purple-600 to-indigo-600',
                    iconBg: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
                    icon: ShieldCheck,
                    path: '/staff/petition',
                },
                {
                    title: 'ตั้งค่าระบบและเทศบาล',
                    desc: 'จัดการพิกัดหน่วยงาน ช่วงเวลาให้บริการ โลโก้ และอุปกรณ์รับส่ง',
                    roleBadge: 'Settings',
                    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
                    gradient: 'from-teal-600 to-emerald-600',
                    iconBg: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
                    icon: Settings,
                    path: '/staff/settings',
                },
                {
                    title: 'จัดการสิทธิ์บทบาท (Roles)',
                    desc: 'ตรวจสอบและปรับเปลี่ยน Role ของสมาชิกในระบบตามโครงสร้างเทศบาล',
                    roleBadge: 'Security',
                    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
                    gradient: 'from-violet-600 to-purple-600',
                    iconBg: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
                    icon: Shield,
                    path: '/admin/roles',
                },
                {
                    title: 'บันทึกประวัติการใช้งาน (Audit Logs)',
                    desc: 'ตรวจสอบประวัติกิจกรรมการเข้าสู่ระบบและการทำงานสำคัญทั้งหมด',
                    roleBadge: 'Audit Logs',
                    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                    gradient: 'from-slate-700 to-slate-900',
                    iconBg: 'bg-slate-500/10 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
                    icon: FileText,
                    path: '/admin/logs',
                },
            ]
        },
        {
            categoryName: 'ฝ่ายปฏิบัติการภาคสนาม (Field & Volunteer Operations)',
            categoryDesc: 'แอปพลิเคชันสำหรับจิตอาสาขับรถและแคร์ยูในการปฏิบัติภารกิจ',
            items: [
                {
                    title: 'หน้าจอจิตอาสาขับรถ (Driver)',
                    desc: 'แอปสำหรับคนขับรถรับงาน นำทาง GPS และยืนยันสถานะการเดินทาง',
                    roleBadge: 'Driver App',
                    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
                    gradient: 'from-amber-500 to-orange-600',
                    iconBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
                    icon: Car,
                    path: '/volunteer/home',
                },
                {
                    title: 'หน้าจอจิตอาสาแคร์ยู (CareU)',
                    desc: 'แอปสำหรับจิตอาสาแคร์ยูดูแลผู้ป่วย ดูข้อมูลสุขภาพ และรายงานผล',
                    roleBadge: 'CareU App',
                    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
                    gradient: 'from-rose-500 to-pink-600',
                    iconBg: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
                    icon: HeartHandshake,
                    path: '/volunteer/careu/home',
                },
            ]
        },
        {
            categoryName: 'ฝ่ายประชาชนและผู้รับบริการ (Citizens & Caregivers)',
            categoryDesc: 'มุมมองสำหรับประชาชนและญาติผู้ดูแลในการจองและติดตามคิวรถ',
            items: [
                {
                    title: 'หน้าจอประชาชน / ผู้สูงอายุ',
                    desc: 'หน้าหลักสำหรับประชาชนในการจองคิวรถ ติดตามสถานะ และดูประวัติ',
                    roleBadge: 'Citizen Portal',
                    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
                    gradient: 'from-emerald-500 to-teal-600',
                    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
                    icon: Users,
                    path: '/elderly/home',
                },
                {
                    title: 'หน้าจอผู้ดูแลประชาชน (Caregiver)',
                    desc: 'สำหรับญาติ/ผู้ดูแลในการจัดการคำขอแทนผู้สูงอายุในความดูแล',
                    roleBadge: 'Caregiver Portal',
                    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
                    gradient: 'from-cyan-600 to-blue-600',
                    iconBg: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400',
                    icon: UserCheck,
                    path: '/caregiver/home',
                },
            ]
        }
    ];

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white pb-16">
                <div className="relative overflow-hidden bg-gradient-to-b from-purple-900/10 via-slate-50 to-slate-50 dark:from-purple-950/30 dark:via-slate-950 dark:to-slate-950 pt-8 pb-10 border-b border-slate-200/50 dark:border-slate-800/60">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-3 border border-purple-200/80 dark:border-purple-800">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                                    <span>Super Admin Control Center</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                    ศูนย์เลือกพอร์ทัล & นโยบายระบบ
                                </h1>
                                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                                    เข้าใช้งานระบบในมุมมองบทบาทต่าง ๆ ขององค์กร หรือควบคุมการเปิด/ปิดนโยบายส่วนกลางที่มีผลกับทุกเทศบาลทั่วประเทศ
                                </p>
                            </div>

                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                                <div className="px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold shrink-0">
                                        <LayoutGrid className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">พอร์ทัลพร้อมใช้</p>
                                        <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">8 หน้าจอ</p>
                                    </div>
                                </div>

                                <div className="px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                                        <SlidersHorizontal className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">นโยบายส่วนกลาง</p>
                                        <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">5 การตั้งค่า</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pt-6 scrollbar-none">
                            {[
                                { id: 'all', label: 'ทั้งหมด (Overview)', icon: LayoutGrid },
                                { id: 'portals', label: 'พอร์ทัลระบบ (System Portals)', icon: ExternalLink },
                                { id: 'policies', label: 'นโยบายส่วนกลาง (Global Policies)', icon: SlidersHorizontal },
                                { id: 'monitor', label: 'ผู้ใช้ออนไลน์สด (Live Monitor)', icon: Activity },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 ring-2 ring-purple-600/30'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850'
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10 flex-1">
                    {(activeTab === 'all' || activeTab === 'monitor') && (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        สถานะผู้ใช้งานออนไลน์สด (Real-time Live Monitor)
                                    </h2>
                                </div>
                                <Link
                                    href="/admin/online-users"
                                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                                >
                                    <span>ดูแบบเต็มจอ</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <OnlineUsersCard />
                            </div>
                        </section>
                    )}

                    {(activeTab === 'all' || activeTab === 'portals') && (
                        <section className="space-y-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>พอร์ทัลเข้าสู่ระบบแยกตามบทบาท</span>
                                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                        คลิกเพื่อสลับมุมมอง
                                    </span>
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    ในฐานะ Super Admin คุณสามารถเข้าสู่ระบบในมุมมองของแต่ละบทบาทได้ทันทีเพื่อทดสอบและสนับสนุนการใช้งาน
                                </p>
                            </div>

                            {portalCategories.map((category, catIdx) => (
                                <div key={category.categoryName} className="space-y-3">
                                    <div className="border-b border-slate-200 dark:border-slate-800/80 pb-2">
                                        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                            {category.categoryName}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {category.categoryDesc}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {category.items.map((portal) => {
                                            const IconComp = portal.icon;
                                            return (
                                                <Link
                                                    key={portal.path + portal.title}
                                                    href={portal.path}
                                                    className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                                                >
                                                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${portal.gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />

                                                    <div>
                                                        <div className="flex items-start justify-between gap-3 mb-4">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${portal.iconBg} group-hover:scale-105 transition-transform`}>
                                                                <IconComp className="w-6 h-6" />
                                                            </div>
                                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${portal.badgeColor}`}>
                                                                {portal.roleBadge}
                                                            </span>
                                                        </div>

                                                        <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                            {portal.title}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                                            {portal.desc}
                                                        </p>
                                                    </div>

                                                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                                                        <span>เข้าสู่หน้าจอ</span>
                                                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </section>
                    )}

                    {(activeTab === 'all' || activeTab === 'policies') && (
                        <section className="space-y-6 pt-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <SlidersHorizontal className="w-5 h-5 text-purple-600" />
                                        <span>นโยบายและการตั้งค่าส่วนกลาง (Global System Policies)</span>
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        การตั้งค่าเหล่านี้มีผลบังคับใช้ครอบคลุมทุกเทศบาลและทุกบทบาทในระบบโดยตรง
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 self-start sm:self-auto">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>บันทึกแบบ Real-time</span>
                                </span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-11 h-11 rounded-xl bg-[#00C300] flex items-center justify-center shadow-md shadow-green-500/20 text-white shrink-0">
                                                    <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                                                        <path d="M19.365 9.864c0-4.08-4.195-7.4-9.365-7.4-5.17 0-9.365 3.32-9.365 7.4 0 3.655 3.27 6.72 7.7 7.28.3.065.707.2.81.458.093.235.06.602.03.84-.045.312-.21 1.22-.23 1.345-.035.195-.16.765.67.417.83-.348 4.48-2.64 6.115-4.52 2.37-2.6 3.64-4.11 3.64-5.82z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                            ระบบแจ้งเตือนผ่าน LINE
                                                        </h3>
                                                        {lineNotificationEnabled ? (
                                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                                เปิดใช้งาน (ทุกเทศบาล)
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                                ปิดใช้งาน
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                        เปิด/ปิดระบบส่งข้อความแจ้งเตือนผ่าน LINE ทั่วประเทศ รวมถึงปิดการเด้งป็อปอัปแนะนำการผูกบัญชี LINE แก่ประชาชนทั้งหมด
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleToggleLineNotification}
                                                disabled={isSavingLineNotificationSetting}
                                                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                                                    lineNotificationEnabled ? 'bg-[#00C300]' : 'bg-slate-300 dark:bg-slate-700'
                                                }`}
                                                aria-pressed={lineNotificationEnabled}
                                                aria-label={lineNotificationEnabled ? 'ปิดระบบแจ้งเตือนผ่าน LINE' : 'เปิดระบบแจ้งเตือนผ่าน LINE'}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                                        lineNotificationEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                                        <span>สถานะการทำงาน: {lineNotificationEnabled ? 'พร้อมส่งข้อความแจ้งเตือน' : 'ระงับการส่งชั่วคราว'}</span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">LIFF & Messaging API</span>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0">
                                                    <CalendarDays className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                            กำหนดเวลาจองคิวล่วงหน้า
                                                        </h3>
                                                        {advanceBookingLimitEnabled ? (
                                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                                ต้องจองล่วงหน้า {advanceBookingUnit === 'DAYS' ? (advanceBookingValue === 1 ? '1 วัน (วันถัดไป)' : `${advanceBookingValue} วัน`) : `${advanceBookingValue} ชม.`}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                                จองวันเดียวกันได้ทันที
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                        กำหนดว่าประชาชนต้องจองคิวก่อนเวลานัดหมายอย่างน้อยกี่วันหรือกี่ชั่วโมง
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleToggleAdvanceBookingLimit}
                                                disabled={isSavingAdvanceBookingSetting}
                                                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                                                    advanceBookingLimitEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                                                }`}
                                                aria-pressed={advanceBookingLimitEnabled}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                                        advanceBookingLimitEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {advanceBookingLimitEnabled && (
                                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium">หน่วยการนับ:</span>
                                                    <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveAdvanceBooking('DAYS', advanceBookingUnit === 'DAYS' ? advanceBookingValue : 1)}
                                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                                                advanceBookingUnit === 'DAYS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            เป็นวัน (วันถัดไป)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveAdvanceBooking('HOURS', advanceBookingUnit === 'HOURS' ? advanceBookingValue : 1)}
                                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                                                advanceBookingUnit === 'HOURS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            เป็นชั่วโมง
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {(advanceBookingUnit === 'DAYS' ? [1, 2, 3, 5, 7] : [1, 2, 6, 12, 24]).map((val) => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => handleSaveAdvanceBooking(advanceBookingUnit, val)}
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                                                advanceBookingValue === val
                                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                                                            }`}
                                                        >
                                                            {val} {advanceBookingUnit === 'DAYS' ? 'วัน' : 'ชม.'}
                                                        </button>
                                                    ))}

                                                    <form
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            const num = parseInt(customAdvanceInput, 10);
                                                            if (!isNaN(num) && num > 0) handleSaveAdvanceBooking(advanceBookingUnit, num);
                                                        }}
                                                        className="flex items-center gap-1 ml-auto"
                                                    >
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="720"
                                                            value={customAdvanceInput}
                                                            onChange={(e) => setCustomAdvanceInput(e.target.value)}
                                                            className="w-12 px-1.5 py-0.5 text-xs text-center font-bold bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                                                        />
                                                        <button type="submit" className="px-2 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded">
                                                            บันทึก
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                                        มีผลบังคับใช้กับระบบจองคิวรถของประชาชนและผู้ดูแลทั่วประเทศ
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-md shadow-rose-500/20 text-white shrink-0">
                                                    <Clock className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                            กำหนดยกเลิกคิว (ประชาชน)
                                                        </h3>
                                                        {allowUserCancelQueue ? (
                                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                                                ยกเลิกล่วงหน้า {cancelQueueUnit === 'DAYS' ? (cancelQueueValue === 1 ? '1 วัน' : `${cancelQueueValue} วัน`) : `${cancelQueueValue} ชม.`}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                                ปิดการยกเลิกเอง
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                        อนุญาตให้ประชาชนกดยกเลิกคิวเองได้หรือไม่ และต้องยกเลิกล่วงหน้าอย่างน้อยเท่าใด
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleToggleAllowUserCancelQueue}
                                                disabled={isSavingCancelSetting}
                                                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                                                    allowUserCancelQueue ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
                                                }`}
                                                aria-pressed={allowUserCancelQueue}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                                        allowUserCancelQueue ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {allowUserCancelQueue && (
                                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium">หน่วยการนับ:</span>
                                                    <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveQueueCancelSetting('DAYS', cancelQueueUnit === 'DAYS' ? cancelQueueValue : 1)}
                                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                                                cancelQueueUnit === 'DAYS' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            เป็นวันก่อนเริ่มงาน
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveQueueCancelSetting('HOURS', cancelQueueUnit === 'HOURS' ? cancelQueueValue : 24)}
                                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                                                cancelQueueUnit === 'HOURS' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            เป็นชั่วโมง
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {(cancelQueueUnit === 'DAYS' ? [1, 2, 3, 5, 7] : [1, 2, 6, 12, 24]).map((val) => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => handleSaveQueueCancelSetting(cancelQueueUnit, val)}
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                                                cancelQueueValue === val
                                                                    ? 'bg-rose-500 text-white shadow-sm'
                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                                                            }`}
                                                        >
                                                            {val} {cancelQueueUnit === 'DAYS' ? 'วัน' : 'ชม.'}
                                                        </button>
                                                    ))}

                                                    <form
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            const num = parseInt(customUserCancelInput, 10);
                                                            if (!isNaN(num) && num >= 0) handleSaveQueueCancelSetting(cancelQueueUnit, num);
                                                        }}
                                                        className="flex items-center gap-1 ml-auto"
                                                    >
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="720"
                                                            value={customUserCancelInput}
                                                            onChange={(e) => setCustomUserCancelInput(e.target.value)}
                                                            className="w-12 px-1.5 py-0.5 text-xs text-center font-bold bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                                                        />
                                                        <button type="submit" className="px-2 py-0.5 bg-rose-500 text-white text-[11px] font-bold rounded">
                                                            บันทึก
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                                        หากปิดใช้งาน ประชาชนจะต้องติดต่อเทศบาลเพื่อขอยกเลิกคิวเท่านั้น
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20 text-white shrink-0">
                                                    <Car className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                            กำหนดยกเลิกงาน (คนขับ/แคร์ยู)
                                                        </h3>
                                                        {allowVolunteerCancelJob ? (
                                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                                ยกเลิกล่วงหน้า {volunteerCancelUnit === 'DAYS' ? (volunteerCancelValue === 1 ? '1 วัน' : `${volunteerCancelValue} วัน`) : `${volunteerCancelValue} ชม.`}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                                ปิดการยกเลิกเอง
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                        อนุญาตให้คนขับและแคร์ยูยกเลิกงานที่ได้รับมอบหมายด้วยตนเองหรือไม่
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleToggleAllowVolunteerCancelJob}
                                                disabled={isSavingVolunteerCancelSetting}
                                                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                                                    allowVolunteerCancelJob ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                                                }`}
                                                aria-pressed={allowVolunteerCancelJob}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                                        allowVolunteerCancelJob ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {allowVolunteerCancelJob && (
                                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium">หน่วยการนับ:</span>
                                                    <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveVolunteerCancelSetting('DAYS', volunteerCancelUnit === 'DAYS' ? volunteerCancelValue : 1)}
                                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                                                volunteerCancelUnit === 'DAYS' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            เป็นวันก่อนเริ่มงาน
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveVolunteerCancelSetting('HOURS', volunteerCancelUnit === 'HOURS' ? volunteerCancelValue : 24)}
                                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                                                volunteerCancelUnit === 'HOURS' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            เป็นชั่วโมง
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {(volunteerCancelUnit === 'DAYS' ? [1, 2, 3, 5, 7] : [1, 2, 6, 12, 24]).map((val) => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => handleSaveVolunteerCancelSetting(volunteerCancelUnit, val)}
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                                                volunteerCancelValue === val
                                                                    ? 'bg-amber-500 text-white shadow-sm'
                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                                                            }`}
                                                        >
                                                            {val} {volunteerCancelUnit === 'DAYS' ? 'วัน' : 'ชม.'}
                                                        </button>
                                                    ))}

                                                    <form
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            const num = parseInt(customVolunteerCancelInput, 10);
                                                            if (!isNaN(num) && num >= 0) handleSaveVolunteerCancelSetting(volunteerCancelUnit, num);
                                                        }}
                                                        className="flex items-center gap-1 ml-auto"
                                                    >
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="720"
                                                            value={customVolunteerCancelInput}
                                                            onChange={(e) => setCustomVolunteerCancelInput(e.target.value)}
                                                            className="w-12 px-1.5 py-0.5 text-xs text-center font-bold bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                                                        />
                                                        <button type="submit" className="px-2 py-0.5 bg-amber-500 text-white text-[11px] font-bold rounded">
                                                            บันทึก
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                                        มีผลบังคับใช้กับจิตอาสาขับรถและแคร์ยูทั่วประเทศ
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between lg:col-span-2">
                                    <div>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white shrink-0">
                                                    <Lock className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                            ล็อคปุ่ม "นำรถกลับถึงเทศบาลแล้ว" ตามรัศมี GPS
                                                        </h3>
                                                        {lockReturnOfficeEnabled ? (
                                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                                เปิดใช้งาน (รัศมี {returnOfficeRadiusMeters} ม.)
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                                ปิดการตรวจจับ GPS
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                        ปุ่ม “นำรถกลับถึงเทศบาล” ของคนขับจะถูกล็อคจนกว่า GPS ของเครื่องจะเข้ามาอยู่ในรัศมีรอบเทศบาล ป้องกันการปิดงานก่อนเวลา
                                                    </p>
                                                    {orgData?.lat && orgData?.lng ? (
                                                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-mono">
                                                            <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                            พิกัดส่วนกลาง: {orgData.lat.toFixed(6)}, {orgData.lng.toFixed(6)}
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                                                            ⚠️ ยังไม่ได้ระบุพิกัดส่วนกลาง (สามารถกำหนดได้ที่หน้าตั้งค่าระบบ)
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleToggleLockReturnOffice}
                                                disabled={isSavingSetting || isLoadingSetting}
                                                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                                                    lockReturnOfficeEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                                                }`}
                                                aria-pressed={lockReturnOfficeEnabled}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                                        lockReturnOfficeEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {lockReturnOfficeEnabled && (
                                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                                                <span className="text-slate-600 dark:text-slate-300 font-semibold">
                                                    เลือกระยะรัศมีที่อนุญาตให้ปิดงาน:
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {[100, 200, 500, 1000].map((r) => (
                                                        <button
                                                            key={r}
                                                            type="button"
                                                            onClick={() => handleUpdateRadius(r)}
                                                            className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                                                                returnOfficeRadiusMeters === r
                                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                                            }`}
                                                        >
                                                            {r} เมตร
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                                        คนขับจะไม่สามารถปิดงานสำเร็จได้หากอยู่นอกระยะรัศมีที่กำหนด
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}
