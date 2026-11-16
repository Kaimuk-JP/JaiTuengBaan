'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { speakText } from '@/lib/tts';
import type { ChartDataPoint, MonthlyChartDataPoint, DailyChartDataPoint } from '@/types/common';
import { useSocket, Notification } from '@/contexts/SocketContext';
import DashboardStatsCards from './DashboardStatsCards';
import VehicleSummaryTable from './VehicleSummaryTable';
import DashboardScheduleTable from './DashboardScheduleTable';
import VolunteerVehicleChart from './VolunteerVehicleChart';
import { getVehicleTypeName, getFuelTypeName } from '@/utils/jobHelpers';
import {
    LazyMonthlyBookingChart as MonthlyBookingChart,
    LazyEquipmentDemandChart as EquipmentDemandChart,
    LazyPatientTypeChart as PatientTypeChart
} from '@/components/shared/LazyCharts';

import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { th } from 'date-fns/locale';

registerLocale('th', th);

const STAFF_DASHBOARD_TTS_KEY = 'staff_dashboard_tts_enabled';


interface DashboardStats {
    totalBookings: number;
    pendingApproval: number;
    activeJobs: number;
    completedJobs: number;
    pendingElderly: number;
    pendingEdit: number;
    volunteerRequests: number;
}

interface MonthlyData {
    month: string;
    count: number;
}

interface Vehicle {
    id: number;
    licensePlate: string;
    name: string;
    type: string;
    fuelType: string | null;
    brand: string | null;
    model: string | null;
    capacity: number;
    totalMileageKm: number;
    imageUrl: string | null;
    isActive: boolean;
    status?: 'READY' | 'MAINTENANCE' | 'INACTIVE';
}

const ACTIVE_JOB_STATUSES = new Set([
    'PICKING_UP',
    'IN_TRANSIT',
    'AT_HOSPITAL',
    'AT_PATIENT_HOME',
    'RETURN_HOME',
    'RETURN_OFFICE',
]);

const CANCELLED_STATUSES = new Set([
    'CANCELLED',
    'CANCELLED_BY_USER',
    'CANCELLED_BY_MUNICIPAL',
    'REJECTED',
]);

const CANCELLED_OR_COMPLETED_STATUSES = new Set([
    'CANCELLED',
    'CANCELLED_BY_USER',
    'CANCELLED_BY_MUNICIPAL',
    'REJECTED',
    'COMPLETED',
]);

const isCancelledQueue = (q: any): boolean => {
    const queueStatus = q?.status;
    const jobStatus = q?.job?.status;
    return (
        CANCELLED_STATUSES.has(queueStatus) ||
        (Boolean(jobStatus) && CANCELLED_STATUSES.has(jobStatus))
    );
};

const getQueueJobStatus = (queue: any) => queue?.job?.status || queue?.status;
const isActiveJob = (queue: any) => {
    const qStatus = queue?.status;
    const jStatus = queue?.job?.status;
    if (CANCELLED_OR_COMPLETED_STATUSES.has(qStatus) || (jStatus && CANCELLED_OR_COMPLETED_STATUSES.has(jStatus))) {
        return false;
    }
    return ACTIVE_JOB_STATUSES.has(jStatus || qStatus);
};
const getQueueDisplayStatus = (queue: any) => {
    if (queue?.job?.status === 'AT_HOSPITAL' && queue?.job?.returnPickupRequestedAt) {
        return 'RETURN_PICKUP_REQUESTED';
    }
    return getQueueJobStatus(queue);
};

const getQueueDisplayName = (queue: any) => {
    const firstName = queue?.user?.firstName || '';
    const lastName = queue?.user?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'ประชาชน';
};

const getDriverDisplayName = (queue: any) => {
    const driver = queue?.job?.vlt || queue?.job?.driver;
    if (!driver) return 'เจ้าหน้าที่ขับรถ';
    const firstName = driver.firstName || '';
    const lastName = driver.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || driver.displayName || 'เจ้าหน้าที่ขับรถ';
};

const getHospitalDisplayName = (queue: any) => {
    return queue?.hospital?.name || queue?.hospitalName || 'โรงพยาบาล';
};

const getStatusLabel = (status: string) => {
    const mapping: Record<string, string> = {
        PENDING_MUNICIPAL: 'รอตรวจสอบ',
        PENDING: 'รอตรวจสอบ',
        APPROVED: 'อนุมัติแล้ว',
        PENDING_EXECUTIVE: 'รอผู้บริหารอนุมัติ',
        EXECUTIVE_REJECTED: 'ผู้บริหารส่งกลับแก้ไข',
        CONFIRMED: 'รอมอบหมายจิตอาสา',
        OPEN: 'รอมอบหมายจิตอาสา',
        ASSIGNED: 'มอบหมายจิตอาสาแล้ว',
        ACCEPTED: 'จิตอาสารับงานแล้ว',
        PICKING_UP: 'กำลังไปรับประชาชน',
        IN_PROGRESS: 'กำลังดูแลประชาชน',
        IN_TRANSIT: 'กำลังเดินทางไปโรงพยาบาล',
        AT_HOSPITAL: 'ถึงโรงพยาบาลแล้ว',
        RETURN_PICKUP_REQUESTED: 'เรียกรถกลับแล้ว',
        RETURN_HOME: 'กำลังพาประชาชนกลับบ้าน',
        AT_PATIENT_HOME: 'ส่งถึงบ้านแล้ว',
        RETURN_OFFICE: 'กำลังกลับเทศบาล',
        COMPLETED: 'เสร็จสิ้น',
        REJECTED: 'ปฏิเสธ',
        CANCELLED: 'ยกเลิก',
        CANCELLED_BY_USER: 'ผู้ใช้ยกเลิก',
        CANCELLED_BY_MUNICIPAL: 'เทศบาลยกเลิก',
    };
    return mapping[status] || status;
};

const getStatusAnnouncement = (patientName: string, status: string, driverName = 'เจ้าหน้าที่ขับรถ') => {
    switch (status) {
        case 'PICKING_UP':
            return `${driverName} กำลังไปรับ ${patientName}`;
        case 'IN_TRANSIT':
        case 'IN_PROGRESS':
            return `${driverName} กำลังพา ${patientName} ไปโรงพยาบาล`;
        case 'AT_HOSPITAL':
            return `${driverName} พา ${patientName} ถึงโรงพยาบาลแล้ว`;
        case 'RETURN_HOME':
            return `กำลังพา ${patientName} กลับบ้าน`;
        case 'AT_PATIENT_HOME':
            return `${driverName} ส่ง ${patientName} ถึงบ้านแล้ว`;
        case 'RETURN_PICKUP_REQUESTED':
            return `${patientName} เรียกรถกลับแล้ว`;
        case 'RETURN_OFFICE':
            return `${driverName} ส่ง ${patientName} ถึงบ้านแล้ว กำลังกลับเทศบาล`;
        default:
            return `คิวของ ${patientName} เปลี่ยนสถานะเป็น ${getStatusLabel(status)}`;
    }
};

const buildQueueSnapshot = (queues: any[]) => {
    return new Map(
        queues.map((queue: any) => [
            String(queue.id),
            {
                status: getQueueJobStatus(queue),
                displayStatus: getQueueDisplayStatus(queue),
                patientName: getQueueDisplayName(queue),
                driverName: getDriverDisplayName(queue),
                hospitalName: getHospitalDisplayName(queue),
            },
        ]),
    );
};

export default function StaffDashboard() {
    const { socket } = useSocket();
    const [stats, setStats] = useState<DashboardStats>({
        totalBookings: 0,
        pendingApproval: 0,
        activeJobs: 0,
        completedJobs: 0,
        pendingElderly: 0,
        pendingEdit: 0,
        volunteerRequests: 0,
    });
    const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
    const [monthlyData, setMonthlyData] = useState<ChartDataPoint[]>([]);
    const [weeklyData, setWeeklyData] = useState<ChartDataPoint[]>([]);
    const [dailyData, setDailyData] = useState<ChartDataPoint[]>([]);
    const [equipmentData, setEquipmentData] = useState<any[]>([]);
    const [patientTypeData, setPatientTypeData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [rawQueues, setRawQueues] = useState<any[]>([]);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [volunteers, setVolunteers] = useState<any[]>([]);
    const [totalVolunteers, setTotalVolunteers] = useState(0);
    const [dashboardTab, setDashboardTab] = useState<'overview' | 'schedule' | 'vehicles'>('schedule');
    const [exportOpen, setExportOpen] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);
    const hasInitializedQueueSnapshotRef = useRef(false);
    const queueSnapshotRef = useRef<Map<string, { status: string; displayStatus: string; patientName: string; driverName: string; hospitalName: string }>>(new Map());
    const pendingNewQueueAnnouncementIdRef = useRef<string | null>(null);

    const speakDashboardAlert = useCallback((text: string) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) {
            return;
        }

        const savedSetting = window.localStorage.getItem(STAFF_DASHBOARD_TTS_KEY);
        const isEnabled = savedSetting === null ? true : savedSetting === 'true';
        if (!isEnabled) {
            return;
        }

        void speakText(text);
    }, []);

    const queueSnapshotSignature = useMemo(
        () =>
            rawQueues
                .map((queue: any) => `${queue.id}:${getQueueDisplayStatus(queue)}`)
                .sort()
                .join('|'),
        [rawQueues],
    );

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
                setExportOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchDashboardData = useCallback(async (isSilent = false) => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const queryString = params.toString();

            const [queuesRes, elderlyReqRes, editReqRes, vehiclesRes, driveRes, careuRes] = await Promise.all([
                fetchWithAuth(`/queues${queryString ? `?${queryString}` : ''}`),
                fetchWithAuth(`/caregiver/requests?status=PENDING${queryString ? `&${queryString}` : ''}`),
                fetchWithAuth(`/profile-edit-requests?status=PENDING${queryString ? `&${queryString}` : ''}`),
                fetchWithAuth('/vehicles'),
                fetchWithAuth('/users/volunteers?limit=1000'),
                fetchWithAuth('/users/careu?limit=1000'),
            ]);

            const queuesResult = await queuesRes.json();
            const elderlyReqResult = await elderlyReqRes.json();
            const editReqResult = await editReqRes.json();
            const vehiclesResult = await vehiclesRes.json();
            const driveResult = await driveRes.json();
            const careuResult = await careuRes.json();

            const queues = queuesResult.data || [];
            setRawQueues(queues);

            const vehiclesList = Array.isArray(vehiclesResult) ? vehiclesResult : (vehiclesResult.data || []);
            setVehicles(vehiclesList);

            const driveList = Array.isArray(driveResult) ? driveResult : (driveResult.data || []);
            const careuList = Array.isArray(careuResult) ? careuResult : (careuResult.data || []);
            const allVolunteers = [...driveList, ...careuList];

            setVolunteers(allVolunteers);
            setTotalVolunteers(allVolunteers.length);

            const elderlyReqData = Array.isArray(elderlyReqResult) ? elderlyReqResult : (elderlyReqResult.data || []);

            const pendingElderlyCount = elderlyReqData.length;
            const pendingEditCount = editReqResult.data?.length || (Array.isArray(editReqResult) ? editReqResult.length : 0);



            setStats(prev => ({
                ...prev,
                pendingElderly: pendingElderlyCount,
                pendingEdit: pendingEditCount,
            }));

            if (!isSilent) setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            if (!isSilent) setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (notification: Notification) => {
            fetchDashboardData(true);
        };

        const handleRefresh = (payload?: { source?: string; queueId?: number | string }) => {
            if (payload?.source === 'new_queue_request' && payload.queueId != null) {
                pendingNewQueueAnnouncementIdRef.current = String(payload.queueId);
            }
            fetchDashboardData(true);
        };

        const handleRefreshJobs = () => {
            fetchDashboardData(true);
        };

        socket.on('notification', handleNotification);
        socket.on('refresh_dashboard', handleRefresh);
        socket.on('refresh_jobs', handleRefreshJobs);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('refresh_dashboard', handleRefresh);
            socket.off('refresh_jobs', handleRefreshJobs);
        };
    }, [socket, fetchDashboardData]);

    useEffect(() => {
        if (rawQueues.length === 0) return;

        const now = new Date();

        let statsStart: Date;
        let statsEnd: Date;

        if (startDate && endDate) {
            statsStart = new Date(startDate);
            statsStart.setHours(0, 0, 0, 0);
            statsEnd = new Date(endDate);
            statsEnd.setHours(23, 59, 59, 999);
        } else {
            statsStart = new Date(now.getFullYear(), 0, 1);
            statsEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const rangeStart = (startDate && endDate) ? statsStart : today;
        const rangeEnd = (startDate && endDate) ? statsEnd : currentMonthEnd;

        const CANCELLED_OR_FINISHED_STATUSES = new Set([
            'CANCELLED',
            'CANCELLED_BY_USER',
            'CANCELLED_BY_MUNICIPAL',
            'REJECTED',
            'COMPLETED',
        ]);

        const isWaitingForService = (q: any) => {
            const queueStatus = q.status;
            const jobStatus = q.job?.status;

            if (
                CANCELLED_OR_FINISHED_STATUSES.has(queueStatus) ||
                (jobStatus && CANCELLED_OR_FINISHED_STATUSES.has(jobStatus))
            ) {
                return false;
            }

            if (isActiveJob(q)) {
                return false;
            }

            return (
                queueStatus === 'PENDING_MUNICIPAL' ||
                queueStatus === 'PENDING_EXECUTIVE' ||
                queueStatus === 'EXECUTIVE_REJECTED' ||
                queueStatus === 'PENDING' ||
                queueStatus === 'APPROVED' ||
                queueStatus === 'CONFIRMED' ||
                jobStatus === 'OPEN' ||
                jobStatus === 'ASSIGNED' ||
                jobStatus === 'ACCEPTED'
            );
        };

        const pendingApprovalCount = rawQueues.filter((q: any) => {
            if (!isWaitingForService(q)) return false;
            const d = new Date(q.requestDate || q.createdAt);
            return d >= rangeStart && d <= rangeEnd;
        }).length;

        const activeJobsCount = rawQueues.filter((q: any) => {
            if (!isActiveJob(q)) return false;
            const d = new Date(q.requestDate || q.createdAt);
            return d >= rangeStart && d <= rangeEnd;
        }).length;

        setStats(prev => ({
            ...prev,
            totalBookings: rawQueues.length,
            pendingApproval: pendingApprovalCount,
            activeJobs: activeJobsCount,
            completedJobs: rawQueues.filter((q: any) => q.status === 'COMPLETED').length,
            volunteerRequests: rawQueues.filter((q: any) => q.job).length,
        }));

        const activeQueues = rawQueues.filter(q => {
            const d = new Date(q.requestDate || q.createdAt);
            return d >= statsStart && d <= statsEnd;
        });

        setEquipmentData(calculateEquipmentDemand(activeQueues));
        setPatientTypeData(calculatePatientTypes(activeQueues));

        let chartStart: Date;
        let chartEnd: Date;

        if (startDate && endDate) {
            chartStart = new Date(startDate);
            chartStart.setHours(0, 0, 0, 0);
            chartEnd = new Date(endDate);
            chartEnd.setHours(23, 59, 59, 999);
        } else {
            if (viewMode === 'weekly') {
                chartStart = new Date(now);
                chartStart.setHours(0, 0, 0, 0);
                chartStart.setDate(now.getDate() - 6);

                chartEnd = new Date(now);
                chartEnd.setHours(23, 59, 59, 999);
            } else if (viewMode === 'daily') {
                chartStart = new Date(now.getFullYear(), now.getMonth(), 1);
                chartEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            } else {
                chartStart = new Date(now.getFullYear(), 0, 1);
                chartEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            }
        }

        setMonthlyData(calculateMonthlyBookings(activeQueues, chartStart, chartEnd));
        setWeeklyData(calculateWeeklyBookings(activeQueues, chartStart, chartEnd));
        setDailyData(calculateDailyBookings(activeQueues, chartStart, chartEnd));

    }, [viewMode, startDate, endDate, rawQueues]);

    useEffect(() => {
        if (loading) {
            return;
        }

        const nextSnapshot = buildQueueSnapshot(rawQueues);

        if (!hasInitializedQueueSnapshotRef.current) {
            queueSnapshotRef.current = nextSnapshot;
            hasInitializedQueueSnapshotRef.current = true;
            return;
        }

        const previousSnapshot = queueSnapshotRef.current;
        const newQueueAnnouncements: string[] = [];
        const statusChangeAnnouncements: string[] = [];

        nextSnapshot.forEach((currentQueue, queueId) => {
            const previousQueue = previousSnapshot.get(queueId);

            if (!previousQueue) {
                newQueueAnnouncements.push(
                    `มีคิวใหม่ของ ${currentQueue.patientName} ที่ ${currentQueue.hospitalName}`,
                );
                return;
            }

            if (previousQueue.displayStatus !== currentQueue.displayStatus) {
                statusChangeAnnouncements.push(
                    getStatusAnnouncement(
                        currentQueue.patientName,
                        currentQueue.displayStatus,
                        currentQueue.driverName,
                    ),
                );
            }
        });

        const pendingNewQueueId = pendingNewQueueAnnouncementIdRef.current;
        if (pendingNewQueueId) {
            const targetedQueue = nextSnapshot.get(pendingNewQueueId);
            if (targetedQueue) {
                newQueueAnnouncements.length = 0;
                newQueueAnnouncements.push(`มีคิวใหม่ของ ${targetedQueue.patientName} ที่ ${targetedQueue.hospitalName}`);
            }
            pendingNewQueueAnnouncementIdRef.current = null;
        }

        queueSnapshotRef.current = nextSnapshot;

        if (newQueueAnnouncements.length === 0 && statusChangeAnnouncements.length === 0) {
            return;
        }

        const announcements: string[] = [];

        if (newQueueAnnouncements.length === 1) {
            announcements.push(newQueueAnnouncements[0]);
        } else if (newQueueAnnouncements.length > 1) {
            announcements.push(`มีคิวใหม่เข้ามา ${newQueueAnnouncements.length} คิว`);
        }

        if (statusChangeAnnouncements.length === 1) {
            announcements.push(statusChangeAnnouncements[0]);
        } else if (statusChangeAnnouncements.length > 1) {
            announcements.push(`มีคิวอัปเดตสถานะ ${statusChangeAnnouncements.length} คิว`);
        }

        speakDashboardAlert(announcements.join(' . '));
    }, [loading, queueSnapshotSignature, speakDashboardAlert]);

    const calculateMonthlyBookings = (queues: any[], start: Date, end: Date) => {
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const monthsData: MonthlyChartDataPoint[] = [];

        let curr = new Date(start);
        curr.setDate(1);

        while (curr <= end || (curr.getFullYear() === end.getFullYear() && curr.getMonth() === end.getMonth())) {
            const m = curr.getMonth();
            const y = curr.getFullYear();
            const shortYear = (y + 543) % 100;
            monthsData.push({
                label: `${thaiMonths[m]} ${shortYear}`,
                count: 0,
                volunteerCount: 0,
                vehicleCount: 0,
                year: y,
                month: m
            });
            curr.setMonth(curr.getMonth() + 1);
        }

        queues.forEach((queue: any) => {
            const date = new Date(queue.requestDate || queue.createdAt);
            const m = date.getMonth();
            const y = date.getFullYear();

            const monthEntry = monthsData.find(d => d.year === y && d.month === m);
            if (monthEntry) {
                monthEntry.count++;
                if (queue.job) monthEntry.volunteerCount++;
                if (queue.vehicleId || queue.job?.vehicleId || queue.job?.vehicle?.id) monthEntry.vehicleCount++;
            }
        });

        return monthsData.map(d => ({ label: d.label, count: d.count, volunteerCount: d.volunteerCount, vehicleCount: d.vehicleCount }));
    };

    const calculateWeeklyBookings = (queues: any[], start: Date, end: Date) => {
        const toLocalDateStr = (d: Date) => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        const daysData: DailyChartDataPoint[] = [];
        let curr = new Date(start);
        curr.setHours(0, 0, 0, 0);

        while (curr <= end) {
            const dateStr = toLocalDateStr(curr);
            const dayName = curr.toLocaleDateString('th-TH', { weekday: 'short' });
            const label = `${dayName} ${curr.getDate()}`;
            daysData.push({ label, count: 0, volunteerCount: 0, vehicleCount: 0, dateStr });
            curr.setDate(curr.getDate() + 1);
        }

        queues.forEach((queue: any) => {
            const date = new Date(queue.requestDate || queue.createdAt);
            const dateStr = toLocalDateStr(date);
            const dayEntry = daysData.find(d => d.dateStr === dateStr);
            if (dayEntry) {
                dayEntry.count++;
                if (queue.job) dayEntry.volunteerCount++;
                if (queue.vehicleId || queue.job?.vehicleId || queue.job?.vehicle?.id) dayEntry.vehicleCount++;
            }
        });

        return daysData.map(d => ({ label: d.label, count: d.count, volunteerCount: d.volunteerCount, vehicleCount: d.vehicleCount }));
    };

    const calculateDailyBookings = (queues: any[], start: Date, end: Date) => {
        const daysData: DailyChartDataPoint[] = [];
        const toLocalDateStr = (d: Date) => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        let curr2 = new Date(start);
        curr2.setHours(0, 0, 0, 0);

        let count2 = 0;
        while (curr2 <= end && count2 < 62) {
            const dateStr = toLocalDateStr(curr2);
            const dayName = curr2.toLocaleDateString('th-TH', { weekday: 'short' });
            const label = `${dayName} ${curr2.getDate()}`;
            daysData.push({ label, count: 0, volunteerCount: 0, vehicleCount: 0, dateStr });
            curr2.setDate(curr2.getDate() + 1);
            count2++;
        }

        queues.forEach((queue: any) => {
            const date = new Date(queue.requestDate || queue.createdAt);
            const dateStr = toLocalDateStr(date);
            const dayEntry = daysData.find(d => d.dateStr === dateStr);
            if (dayEntry) {
                dayEntry.count++;
                if (queue.job) dayEntry.volunteerCount++;
                if (queue.vehicleId || queue.job?.vehicleId || queue.job?.vehicle?.id) dayEntry.vehicleCount++;
            }
        });

        return daysData.map(d => ({ label: d.label, count: d.count, volunteerCount: d.volunteerCount, vehicleCount: d.vehicleCount }));
    };

    const calculateEquipmentDemand = (queues: any[]): any[] => {
        const equipmentCounts: Record<string, number> = {};

        queues.forEach((queue: any) => {
            const equipment = queue.requiredEquipment;

            if (equipment && typeof equipment === 'string') {
                const equipmentList = equipment.split(',').map((item: string) => item.trim()).filter(Boolean);

                equipmentList.forEach((item: string) => {
                    const label = (item === 'เปลนั่ง' || item === 'เปลนอน') ? 'เปลหาม' : item;

                    if (!equipmentCounts[label]) {
                        equipmentCounts[label] = 0;
                    }
                    equipmentCounts[label]++;
                });
            }
        });

        const gradientColors = [
            '#3D5A0F',
            '#5B7F24',
            '#7A9E3D',
            '#A4C266',
            '#C4D89C',
        ];

        let totalCount = Object.values(equipmentCounts).reduce((sum, count) => sum + count, 0);
        if (totalCount === 0) totalCount = 1;

        const chartData = Object.entries(equipmentCounts).map(([name, rawCount]) => ({
            name,
            count: Math.round((rawCount / totalCount) * 100),
            rawCount
        }));

        const sortedData = [...chartData].sort((a, b) => b.rawCount - a.rawCount);

        const dataWithColors = sortedData.map((item, index) => ({
            ...item,
            color: gradientColors[index] || gradientColors[gradientColors.length - 1]
        }));

        return dataWithColors;
    };

    const calculatePatientTypes = (queues: any[]) => {
        const typeCounts: Record<string, number> = {
            WALKING: 0,
            WHEELCHAIR: 0,
            BEDRIDDEN: 0
        };

        queues.forEach((queue: any) => {
            const status = queue.user?.mobilityStatus;

            if (status && typeCounts.hasOwnProperty(status)) {
                typeCounts[status]++;
            }
        });

        return [
            { type: 'ทั่วไป', count: typeCounts.WALKING, color: '#86C232' },
            { type: 'ต้องดูแลเพิ่ม', count: typeCounts.WHEELCHAIR, color: '#FFA500' },
            { type: 'ต้องดูแลใกล้ชิด', count: typeCounts.BEDRIDDEN, color: '#DC2626' },
        ].filter(item => item.count > 0);
    };


    const getDateRange = () => {
        const now = new Date();
        let startOfRange: Date;
        let endOfRange: Date;

        if (startDate && endDate) {
            startOfRange = new Date(startDate);
            startOfRange.setHours(0, 0, 0, 0);
            endOfRange = new Date(endDate);
            endOfRange.setHours(23, 59, 59, 999);
        } else {
            if (viewMode === 'monthly') {
                startOfRange = new Date(now.getFullYear(), 0, 1);
                endOfRange = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            } else {
                const currentDay = now.getDay();
                const diffToMon = currentDay === 0 ? 6 : currentDay - 1;
                startOfRange = new Date(now);
                startOfRange.setHours(0, 0, 0, 0);
                startOfRange.setDate(now.getDate() - diffToMon);

                endOfRange = new Date(startOfRange);
                endOfRange.setDate(startOfRange.getDate() + 6);
                endOfRange.setHours(23, 59, 59, 999);
            }
        }
        return { startOfRange, endOfRange };
    };

    const getStatusName = (status: string) => getStatusLabel(status);

    const buildPatientCSV = () => {
        const { startOfRange, endOfRange } = getDateRange();
        const filteredQueues = rawQueues.filter(q => {
            const d = new Date(q.createdAt);
            return d >= startOfRange && d <= endOfRange;
        });

        const headers = ['รหัสการจอง', 'วันที่สร้าง', 'สถานะ', 'ชื่อประชาชน', 'ผู้ดูแลประชาชน', 'อุปกรณ์ที่ต้องการ'];
        const rows = filteredQueues.map(q => [
            q.id || '-',
            new Date(q.createdAt).toLocaleDateString('th-TH'),
            getStatusName(q.status),
            q.user ? `${q.user.firstName} ${q.user.lastName}` : '-',
            q.caregiver ? `${q.caregiver.firstName} ${q.caregiver.lastName}` : '-',
            q.requiredEquipment || 'ไม่มี'
        ]);

        return [headers.join(','), ...rows.map(e => e.map(String).map(s => `"${s}"`).join(','))].join('\n');
    };

    const buildVehicleCSV = () => {
        const headers = ['ทะเบียนรถ', 'ชื่อรถ', 'ประเภท', 'เชื้อเพลิง', 'ยี่ห้อ', 'รุ่น', 'ความจุ (คน)', 'เลขไมล์สะสม (กม.)'];
        const rows = vehicles.map(v => [
            v.licensePlate,
            v.name,
            getVehicleTypeName(v.type),
            getFuelTypeName(v.fuelType),
            v.brand || '-',
            v.model || '-',
            v.capacity,
            v.totalMileageKm.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        ]);

        return [headers.join(','), ...rows.map(e => e.map(String).map(s => `"${s}"`).join(','))].join('\n');
    };

    const downloadCSV = (content: string, filename: string) => {
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + content;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportPatientCSV = () => {
        downloadCSV(buildPatientCSV(), `ข้อมูลประชาชน_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
        setExportOpen(false);
    };

    const exportVehicleCSV = () => {
        downloadCSV(buildVehicleCSV(), `ข้อมูลรถส่วนกลาง_${new Date().toLocaleDateString('th-TH')}.csv`);
        setExportOpen(false);
    };

    const exportAllCSV = () => {
        const combined = `=== ข้อมูลประชาชน ===\n${buildPatientCSV()}\n\n=== ข้อมูลรถส่วนกลาง ===\n${buildVehicleCSV()}`;
        downloadCSV(combined, `ข้อมูลทั้งหมด_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
        setExportOpen(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <p className="text-slate-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    const activeJobs = rawQueues.filter(q => {
        if (!isActiveJob(q)) return false;
        const d = new Date(q.requestDate || q.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const start = startDate ? new Date(startDate) : today;
        const end = endDate ? new Date(endDate) : currentMonthEnd;
        return d >= start && d <= end;
    });
    const busyVehicleIds = new Set<number>();
    const busyVolunteerIds = new Set<string>();

    activeJobs.forEach((q: any) => {
        const vehicleId = q.job?.vehicleId ?? q.vehicleId ?? q.job?.vehicle?.id;
        if (typeof vehicleId === 'number') busyVehicleIds.add(vehicleId);

        const vltId = q.job?.vltId ?? q.job?.vlt?.id;
        const careuId = q.job?.careuId ?? q.job?.careu?.id;
        if (vltId) busyVolunteerIds.add(vltId);
        if (careuId) busyVolunteerIds.add(careuId);
    });

    const readyVehicles = vehicles.filter(v => {
        const status = v.status || (v.isActive ? 'READY' : 'INACTIVE');
        return status === 'READY' && !busyVehicleIds.has(v.id);
    }).length;
    const busyVehicles = vehicles.filter(v => busyVehicleIds.has(v.id)).length;
    const availableVehicles = readyVehicles;

    const activeVolunteerIds = new Set(volunteers.filter((v: any) => v.isActive !== false).map((v: any) => v.id));
    const busyVolunteers = Array.from(busyVolunteerIds).filter(id => activeVolunteerIds.has(id)).length;
    const availableVolunteers = Math.max(activeVolunteerIds.size - busyVolunteers, 0);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8 pt-0 pb-8">
            { }
            <div className="flex items-center justify-between mt-5 ml-4 mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">ภาพรวมปริมาณงาน</h2>

                { }
                <div className="relative" ref={exportRef}>
                    <button
                        onClick={() => setExportOpen(!exportOpen)}
                        className="px-4 py-2 flex items-center gap-2 bg-slate-800 dark:bg-gray-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-gray-600 transition shadow-sm"
                        title="ออกรายงานแบบ CSV"
                    >
                        <svg className="w-4 h-4" ml-1="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="text-sm font-medium">Export CSV</span>
                    </button>
                    {exportOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-in">
                            <button onClick={exportPatientCSV} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                                <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></span>
                                <div><div className="font-medium">ข้อมูลประชาชน</div><div className="text-xs text-slate-400 dark:text-gray-500">การจอง, สถานะ, อุปกรณ์</div></div>
                            </button>
                            <button onClick={exportVehicleCSV} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors border-t border-slate-100 dark:border-gray-700">
                                <span className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 flex-shrink-0"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h4m5 4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l2 2 4-4" /></svg></span>
                                <div><div className="font-medium">ข้อมูลรถส่วนกลาง</div><div className="text-xs text-slate-400 dark:text-gray-500">ทะเบียน, ประเภท, เลขไมล์</div></div>
                            </button>
                            <button onClick={exportAllCSV} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors border-t border-slate-100 dark:border-gray-700">
                                <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></span>
                                <div><div className="font-medium">ทุกข้อมูลรวม</div><div className="text-xs text-slate-400 dark:text-gray-500">ประชาชน + รถ รวมในไฟล์เดียว</div></div>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            { }
            <DashboardStatsCards
                stats={stats}
                todayBookings={rawQueues.filter(q => {
                    if (isCancelledQueue(q)) return false;
                    const d = new Date(q.requestDate || q.createdAt);
                    const today = new Date();
                    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
                }).length}
                pendingCount={stats.pendingApproval}
                availableVehicles={availableVehicles}
                busyVehicles={busyVehicles}
                totalVehicles={vehicles.length}
                availableVolunteers={availableVolunteers}
                busyVolunteers={busyVolunteers}
                totalVolunteers={totalVolunteers}
            />

            { }
            <div className="border-b border-slate-200 dark:border-gray-700 mb-6 mt-8">
                <div className="flex gap-6">
                    {[
                        { key: 'schedule', label: 'ตารางการให้บริการ' },
                        { key: 'overview', label: 'ภาพรวมปริมาณงาน' },
                        { key: 'vehicles', label: 'ข้อมูลยานพาหนะ' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setDashboardTab(tab.key as any)}
                            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${dashboardTab === tab.key
                                ? 'border-green-500 text-green-600 dark:text-green-400'
                                : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            { }
            {dashboardTab === 'overview' && (
                <div className="flex flex-wrap items-center gap-3 mb-8 mt-2">
                    { }
                    <div className="flex items-center bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden divide-x divide-slate-200 dark:divide-gray-700">
                        <button
                            onClick={() => setViewMode('daily')}
                            className={`px-5 py-2 text-sm font-medium transition-colors focus:outline-none ${viewMode === 'daily'
                                ? 'text-green-600 dark:text-green-400 bg-slate-50 dark:bg-gray-700/50'
                                : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            รายวัน
                        </button>
                        <button
                            onClick={() => setViewMode('weekly')}
                            className={`px-5 py-2 text-sm font-medium transition-colors focus:outline-none ${viewMode === 'weekly'
                                ? 'text-green-600 dark:text-green-400 bg-slate-50 dark:bg-gray-700/50'
                                : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            รายสัปดาห์
                        </button>
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`px-5 py-2 text-sm font-medium transition-colors focus:outline-none ${viewMode === 'monthly'
                                ? 'text-green-600 dark:text-green-400 bg-slate-50 dark:bg-gray-700/50'
                                : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            รายเดือน
                        </button>
                    </div>

                    { }
                    <label htmlFor="dashboard-datepicker" className="cursor-pointer flex items-center bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-4 py-2 focus-within:ring-1 focus-within:ring-slate-300 relative z-50">
                        <style>{`
                            .react-datepicker {
                                display: flex !important;
                                flex-direction: row !important;
                                width: max-content !important;
                            }
                            .react-datepicker__month-container {
                                float: none !important;
                            }
                            .react-datepicker-popper[data-placement^="bottom"] .react-datepicker__triangle {
                                left: 50% !important;
                                transform: translateX(-50%) !important;
                            }
                        `}</style>
                        <DatePicker
                            id="dashboard-datepicker"
                            selectsRange={true}
                            startDate={startDate ? new Date(startDate) : undefined}
                            endDate={endDate ? new Date(endDate) : undefined}
                            onChange={(update: [Date | null, Date | null]) => {
                                const [start, end] = update;
                                const formatYMD = (d: Date) => {
                                    const offset = d.getTimezoneOffset();
                                    return new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
                                };
                                setStartDate(start ? formatYMD(start) : '');
                                setEndDate(end ? formatYMD(end) : '');
                            }}
                            locale="th"
                            monthsShown={2}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="วว/ดด/ปปปป - วว/ดด/ปปปป"
                            className="cursor-pointer focus:outline-none text-sm text-slate-500 dark:text-gray-300 bg-transparent w-[210px] text-center"
                        />
                        <svg className="w-5 h-5 text-slate-400 dark:text-gray-500 pointer-events-none ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </label>
                </div>
            )}

            { }
            {dashboardTab === 'overview' && (() => {
                const activeData = viewMode === 'monthly' ? monthlyData : (viewMode === 'weekly' ? weeklyData : dailyData);
                return (
                    <div className="flex flex-col gap-6 mb-6">
                        <div className="animate-fade-in h-full" style={{ animationDelay: '0.1s' }}>
                            <MonthlyBookingChart
                                data={activeData}
                                viewMode={viewMode}
                            />
                        </div>
                        <div className="animate-fade-in h-full" style={{ animationDelay: '0.2s' }}>
                            <VolunteerVehicleChart
                                labels={activeData.map((m: any) => m.label)}
                                volunteerData={activeData.map((m: any) => m.volunteerCount)}
                                vehicleData={activeData.map((m: any) => m.vehicleCount)}
                            />
                        </div>
                    </div>
                );
            })()}

            { }
            {dashboardTab === 'schedule' && <DashboardScheduleTable queues={rawQueues} />}

            { }
            {dashboardTab === 'vehicles' && (
                <VehicleSummaryTable vehicles={vehicles} busyVehicleIds={Array.from(busyVehicleIds)} />
            )}
        </div >
    );
}
