'use client';

import { useState, useMemo } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import CareUSidebar from '@/components/careu/Sidebar/CareUSidebar';
import CareUHeader from '@/components/careu/Header/CareUHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { getRoundGroup, getBangkokDateKey, getVolunteerJobStatusDisplay } from '@/utils/jobHelpers';
import { useSocket } from '@/contexts/SocketContext';
import Swal from '@/lib/swal';


interface JobItem {
    id: number;
    patientId: string;
    date: string;
    time: string;
    patientName: string;
    hospital: string;
    department?: string;
    status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    jobStatus?: string;
    equipment?: string;
    note?: string;
    patientPhone?: string;
    patientPictureUrl?: string;
    driverName?: string;
    driverPhone?: string;
    driverPictureUrl?: string;
    diseases?: string[];
    severityLevel?: string;
    mobilityStatus?: string;
    returnPickupRequestedAt?: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    UPCOMING: { label: 'รอดำเนินการ', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
    IN_PROGRESS: { label: 'กำลังดำเนินการ', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
    COMPLETED: { label: 'เสร็จสิ้น', color: 'text-green-700', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
    CANCELLED: { label: 'ยกเลิก', color: 'text-red-600', bg: 'bg-red-50 border-red-200', dot: 'bg-red-400' },
};

const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];
const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function toThaiDate(iso: string) {
    const d = new Date(iso + 'T00:00:00');
    return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

const MOBILITY_LABELS: Record<string, string> = {
    'WALKING': 'ทั่วไป',
    'WHEELCHAIR': 'ใช้วีลแชร์',
    'BEDRIDDEN': 'ติดเตียง',
};

const SEVERITY_LABELS: Record<string, string> = {
    'GREEN': 'ทั่วไป',
    'YELLOW': 'ต้องดูแลเพิ่ม',
    'RED': 'ต้องดูแลใกล้ชิด',
};

function isSameDay(a: string, b: string) {
    return a === b;
}

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

function PhoneCallButton({ phone, label = 'โทร' }: { phone: string; label?: string }) {
    return (
        <a
            href={`tel:${phone}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={label}
            title={label}
            className="w-9 h-9 rounded-xl bg-brand-primary text-white flex items-center justify-center hover:bg-btn-hover active:scale-95 transition-all shrink-0 shadow-sm"
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
        </a>
    );
}

export default function JobCalendar() {
    const router = useRouter();
    const { user } = useAuth();

    const today = useMemo(() => new Date(), []);
    const todayISO = useMemo(() => toISO(today.getFullYear(), today.getMonth(), today.getDate()), [today]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(todayISO);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [jobs, setJobs] = useState<JobItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
    const { socket } = useSocket();

    useEffect(() => {
        if (!user?.id) return;
        const fetchJobs = async () => {
            try {
                setIsLoading(true);
                const res = await fetchWithAuth(`/jobs/assigned-to/${user.id}`);
                if (!res.ok) throw new Error('Failed to fetch jobs');
                const data = await res.json();

                const mappedJobs: JobItem[] = data.map((job: any) => {
                    let st: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' = 'UPCOMING';
                    if (['ASSIGNED', 'ACCEPTED'].includes(job.status)) st = 'UPCOMING';
                    else if (['PICKING_UP', 'IN_TRANSIT', 'AT_HOSPITAL', 'RETURN_HOME', 'AT_PATIENT_HOME', 'RETURN_OFFICE'].includes(job.status)) st = 'IN_PROGRESS';
                    else if (['COMPLETED'].includes(job.status)) st = 'COMPLETED';
                    else if (['CANCELLED', 'REJECTED'].includes(job.status)) st = 'CANCELLED';

                    const queue = job.queue || {};
                    const patient = queue.user || {};
                    const hospitalName = queue.hospital?.name || queue.hospitalName || 'ไม่ระบุโรงพยาบาล';
                    const driver = job.vlt || {};

                    let allDiseases: string[] = [];
                    if (patient.diseases && Array.isArray(patient.diseases)) {
                        allDiseases = [
                            ...allDiseases,
                            ...patient.diseases
                                .map((d: any) => {
                                    if (typeof d === 'string') return d;
                                    if (d?.disease?.name) return d.disease.name;
                                    if (d?.name) return d.name;
                                    return null;
                                })
                                .filter((name: string | null): name is string => typeof name === 'string' && name.trim() !== ''),
                        ];
                    }
                    if (patient.customDiseases && Array.isArray(patient.customDiseases)) {
                        allDiseases = [...allDiseases, ...patient.customDiseases];
                    }

                    let jobDate = todayISO;
                    if (queue.requestDate) {
                        jobDate = getBangkokDateKey(queue.requestDate);
                    }

                    return {
                        id: job.id,
                        patientId: patient.id,
                        date: jobDate,
                        time: queue.bookingTime || '-',
                        patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'ไม่มีชื่อ',
                        patientPhone: patient.phone,
                        patientPictureUrl: patient.pictureUrl,
                        driverName: `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || undefined,
                        driverPhone: driver.phone,
                        driverPictureUrl: driver.pictureUrl,
                        hospital: hospitalName,
                        department: undefined,
                        status: st,
                        jobStatus: job.status,
                        equipment: Array.isArray(queue.requiredEquipment) ? queue.requiredEquipment.join(', ') : queue.requiredEquipment,
                        diseases: allDiseases,
                        severityLevel: queue.severityLevel,
                        mobilityStatus: patient.mobilityStatus,
                        returnPickupRequestedAt: job.returnPickupRequestedAt || null,
                    };
                });

                setJobs(mappedJobs);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchJobs();
    }, [user?.id]);

    useEffect(() => {
        if (!socket || !user?.id) return;
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const handleRealtimeUpdate = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                try {
                    const res = await fetchWithAuth(`/jobs/assigned-to/${user.id}`);
                    if (!res.ok) return;
                    const data = await res.json();
                    const mappedJobs: JobItem[] = data.map((job: any) => {
                        let st: JobItem['status'] = 'UPCOMING';
                        if (['ASSIGNED', 'ACCEPTED'].includes(job.status)) st = 'UPCOMING';
                        else if (['PICKING_UP', 'IN_TRANSIT', 'AT_HOSPITAL', 'RETURN_HOME', 'AT_PATIENT_HOME', 'RETURN_OFFICE'].includes(job.status)) st = 'IN_PROGRESS';
                        else if (['COMPLETED'].includes(job.status)) st = 'COMPLETED';
                        else if (['CANCELLED', 'REJECTED'].includes(job.status)) st = 'CANCELLED';
                        const queue = job.queue || {};
                        const patient = queue.user || {};
                        const hospitalName = queue.hospital?.name || queue.hospitalName || 'ไม่ระบุโรงพยาบาล';
                        const driver = job.vlt || {};
                        let allDiseases: string[] = [];
                        if (patient.diseases && Array.isArray(patient.diseases)) {
                            allDiseases = patient.diseases
                                .map((d: any) => d?.disease?.name || d?.name || (typeof d === 'string' ? d : null))
                                .filter((name: string | null): name is string => typeof name === 'string' && name.trim() !== '');
                        }
                        if (patient.customDiseases && Array.isArray(patient.customDiseases)) {
                            allDiseases = [...allDiseases, ...patient.customDiseases];
                        }
                        const jobDate = queue.requestDate ? getBangkokDateKey(queue.requestDate) : todayISO;
                        return {
                            id: job.id,
                            patientId: patient.id,
                            date: jobDate,
                            time: queue.bookingTime || '-',
                            patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'ไม่มีชื่อ',
                            patientPhone: patient.phone,
                            patientPictureUrl: patient.pictureUrl,
                            driverName: `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || undefined,
                            driverPhone: driver.phone,
                            driverPictureUrl: driver.pictureUrl,
                            hospital: hospitalName,
                            status: st,
                            jobStatus: job.status,
                            equipment: Array.isArray(queue.requiredEquipment) ? queue.requiredEquipment.join(', ') : queue.requiredEquipment,
                            diseases: allDiseases,
                            severityLevel: queue.severityLevel,
                            mobilityStatus: patient.mobilityStatus,
                            returnPickupRequestedAt: job.returnPickupRequestedAt || null,
                        };
                    });
                    setJobs(mappedJobs);
                } catch {
                }
            }, 1500);
        };
        socket.on('notification', handleRealtimeUpdate);
        socket.on('refresh_jobs', handleRealtimeUpdate);
        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            socket.off('notification', handleRealtimeUpdate);
            socket.off('refresh_jobs', handleRealtimeUpdate);
        };
    }, [socket, user?.id, todayISO]);

    const [calYear, setCalYear] = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth());

    const jobDatesSet = useMemo(() => {
        const s = new Set<string>();
        jobs.forEach(j => {
            if (activeTab === 'upcoming') {
                if ((j.status === 'UPCOMING' || j.status === 'IN_PROGRESS') && j.date >= todayISO) {
                    s.add(j.date);
                }
            } else {
                if (j.status === 'COMPLETED' || j.status === 'CANCELLED') {
                    s.add(j.date);
                }
            }
        });
        return s;
    }, [jobs, activeTab, todayISO]);

    const filteredJobs = useMemo(() => {
        let currentJobs = [...jobs];
        if (activeTab === 'upcoming') {
            currentJobs = currentJobs.filter(j => (j.status === 'UPCOMING' || j.status === 'IN_PROGRESS') && j.date >= todayISO);
        } else {
            currentJobs = currentJobs.filter(j => j.status === 'COMPLETED' || j.status === 'CANCELLED');
        }
        if (selectedDate) {
            currentJobs = currentJobs.filter(j => isSameDay(j.date, selectedDate));
        }
        return currentJobs.sort((a, b) => {
            if (activeTab === 'upcoming') return a.date.localeCompare(b.date);
            return b.date.localeCompare(a.date);
        });
    }, [jobs, activeTab, selectedDate, todayISO]);

    const groupedJobs = useMemo(() => {
        const groups: Record<string, { groupKey: string; jobs: JobItem[] }> = {};
        filteredJobs.forEach(job => {
            const hosp = job.hospital || 'unknown_hosp';
            const roundGroup = getRoundGroup(job.time);
            const statusGroup = job.status;
            const groupKey = `${job.date}_${hosp}_${roundGroup}_${statusGroup}`;

            if (!groups[groupKey]) {
                groups[groupKey] = { groupKey, jobs: [] };
            }
            groups[groupKey].jobs.push(job);
        });
        return Object.values(groups);
    }, [filteredJobs]);

    const calendarDays = useMemo(() => {
        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const grid: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) grid.push(null);
        for (let d = 1; d <= daysInMonth; d++) grid.push(d);
        return grid;
    }, [calYear, calMonth]);

    const prevMonth = () => {
        if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11); }
        else setCalMonth(calMonth - 1);
    };
    const nextMonth = () => {
        if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0); }
        else setCalMonth(calMonth + 1);
    };
    const goToday = () => {
        setCalYear(today.getFullYear());
        setCalMonth(today.getMonth());
        setSelectedDate(todayISO);
    };

    const upcomingCount = jobs.filter(j => (j.status === 'UPCOMING' || j.status === 'IN_PROGRESS') && j.date === todayISO).length;
    const completedCount = jobs.filter(j => j.status === 'COMPLETED' && j.date === todayISO).length;

    return (
        <div className="min-h-[100dvh] h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#F5F5F5] dark:bg-gray-900 font-sans pb-24">
            <CareUSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {}
            <div className="bg-gradient-to-bl from-[#3AAE7D] to-[#346D55] dark:from-slate-800 dark:to-slate-900 text-white relative">
                <CareUHeader
                    user={null}
                    onToggleSidebar={() => setSidebarOpen(true)}
                    iconColor="white"
                />
            </div>

            {}
            <div className="px-4 mt-4 max-w-md mx-auto space-y-4">

                {}
                <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">คิวงานวัน ณ ปัจจุบัน</h1>
                </div>

                {}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">งานที่รอดำเนินการ</p>
                        <p className="text-2xl font-bold text-amber-600">{upcomingCount}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">เสร็จสิ้นแล้ว</p>
                        <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                    </div>
                </div>

                {}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                    {}
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={goToday} className="text-base font-bold text-gray-800 dark:text-white hover:text-brand-primary transition-colors">
                            {THAI_MONTHS[calMonth]} {calYear + 543}
                        </button>
                        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {THAI_DAYS_SHORT.map(d => (
                            <div key={d} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">{d}</div>
                        ))}
                    </div>

                    {}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, i) => {
                            if (day === null) return <div key={`e-${i}`} />;
                            const iso = toISO(calYear, calMonth, day);
                            const isToday = iso === todayISO;
                            const isPast = iso < todayISO;
                            const isDisabled = isPast && activeTab === 'upcoming';
                            const isSelected = selectedDate === iso;
                            const hasJob = jobDatesSet.has(iso);

                            return (
                                <button
                                    key={iso}
                                    onClick={() => !isDisabled && setSelectedDate(isSelected ? null : iso)}
                                    disabled={isDisabled}
                                    className={`
                                        relative flex flex-col items-center justify-center py-1.5 rounded-lg text-sm font-medium transition-all
                                        ${isDisabled ? 'opacity-30 cursor-not-allowed text-gray-400 dark:text-gray-600' :
                                            isSelected
                                                ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/30'
                                                : isToday
                                                    ? 'bg-brand-primary/10 text-brand-primary font-bold ring-1 ring-brand-primary/40'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }
                                    `}
                                >
                                    {day}
                                    {hasJob && (
                                        <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-brand-primary'}`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {}
                <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex-1 py-2.5 rounded-lg text-base font-semibold transition-all ${activeTab === 'upcoming'
                            ? 'bg-brand-primary text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                            }`}
                    >
                        งานที่จะมาถึง ({upcomingCount})
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={`flex-1 py-2.5 rounded-lg text-base font-semibold transition-all ${activeTab === 'past'
                            ? 'bg-brand-primary text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                            }`}
                    >
                        ประวัติงาน ({completedCount})
                    </button>
                </div>

                {}
                <div className="space-y-3">
                    {groupedJobs.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
                                {selectedDate
                                    ? `ไม่มีงานในวันที่ ${toThaiDate(selectedDate)}`
                                    : activeTab === 'upcoming'
                                        ? 'ยังไม่มีงานที่จะมาถึง'
                                        : 'ยังไม่มีประวัติงาน'
                                }
                            </p>
                            <p className="text-sm text-gray-400 mt-1">งานจะปรากฏเมื่อเทศบาลมอบหมาย</p>
                        </div>
                    ) : isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-brand-primary"></div>
                        </div>
                    ) : (
                        groupedJobs.map(group => {
                            const firstJob = group.jobs[0];
                            const st = STATUS_MAP[firstJob.status] || STATUS_MAP.UPCOMING;
                            const jobStatusDetail = firstJob.jobStatus
                                ? getVolunteerJobStatusDisplay(firstJob.jobStatus, firstJob.returnPickupRequestedAt)
                                : null;
                            return (
                                <div
                                    key={group.groupKey}
                                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
                                >
                                    {}
                                    <div className={`px-4 py-2 flex items-center justify-between ${st.bg} border-b`}>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                                            <span className={`text-sm font-bold ${st.color}`}>{st.label}</span>
                                            {jobStatusDetail && firstJob.status === 'IN_PROGRESS' && (
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${jobStatusDetail.color}`}>
                                                    {jobStatusDetail.label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                                {toThaiDate(firstJob.date)}
                                            </span>
                                        </div>
                                    </div>

                                    {}
                                    <div className="p-4 flex flex-col gap-3">
                                        {}
                                        <div className="flex flex-col gap-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700">

                                            {}
                                            {group.jobs.map((job, idx) => (
                                                <div
                                                    key={job.id}
                                                    onClick={() => setSelectedJob(job)}
                                                    className={`flex flex-col gap-2 cursor-pointer ${idx !== group.jobs.length - 1 ? 'border-b border-gray-100 dark:border-gray-700 pb-3' : ''}`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            <div className="w-10 h-10 rounded-full bg-[#E8F3EF] text-[#1E7D55] flex items-center justify-center font-bold text-[15px] shrink-0 overflow-hidden mt-0.5">
                                                                {job.patientPictureUrl ? (
                                                                    <img
                                                                        src={`${process.env.NEXT_PUBLIC_API_URL}${job.patientPictureUrl}`}
                                                                        alt="User Profile"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    job.patientName.replace(/^คุณ(ยาย|ตา)/, '').charAt(0)
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className="font-bold text-gray-800 dark:text-white text-base truncate">{job.patientName} <span className="text-sm font-normal text-gray-500">ผู้ใช้บริการ</span></h3>
                                                                <div className="text-base text-gray-700 dark:text-gray-300 mt-1.5 space-y-1">
                                                                    <p className="truncate">{job.hospital}{job.department ? ` • ${job.department}` : ''}</p>
                                                                    {job.diseases && job.diseases.length > 0 && (
                                                                        <p className="line-clamp-2 break-words text-left text-gray-700 dark:text-gray-300">
                                                                            โรคประจำตัว: {job.diseases.join(', ')}
                                                                        </p>
                                                                    )}
                                                                    <p className="truncate">เวลาไป: {job.time}</p>
                                                                    {job.mobilityStatus && <p className="truncate">การเคลื่อนไหว: {MOBILITY_LABELS[job.mobilityStatus] || job.mobilityStatus}</p>}
                                                                    {job.severityLevel && <p className="truncate">ระดับการดูแล: {SEVERITY_LABELS[job.severityLevel] || job.severityLevel}</p>}
                                                                    {job.equipment && <p className="truncate">อุปกรณ์: {job.equipment}</p>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {job.patientPhone && (job.status === 'UPCOMING' || job.status === 'IN_PROGRESS') && (
                                                            <PhoneCallButton phone={job.patientPhone} label="โทรผู้รับบริการ" />
                                                        )}
                                                    </div>

                                                </div>
                                            ))}

                                            {firstJob.driverName && (
                                                <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 overflow-hidden">
                                                            {firstJob.driverPictureUrl ? (
                                                                <img
                                                                    src={`${process.env.NEXT_PUBLIC_API_URL}${firstJob.driverPictureUrl}`}
                                                                    alt="Driver Profile"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="font-bold text-gray-800 dark:text-white text-base truncate">{firstJob.driverName} <span className="text-sm font-normal text-gray-500">เจ้าหน้าที่ขับรถ</span></h3>
                                                        </div>
                                                    </div>
                                                    {firstJob.driverPhone && (firstJob.status === 'UPCOMING' || firstJob.status === 'IN_PROGRESS') && (
                                                        <PhoneCallButton phone={firstJob.driverPhone} label="โทรเจ้าหน้าที่ขับรถ" />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {}
                                        {group.jobs.some(j => j.note) && (
                                            <div className="text-sm text-gray-400 italic">
                                                {group.jobs.filter(j => j.note).map((j, i) => (
                                                    <p key={j.id}>📝 {group.jobs.length > 1 ? `${j.patientName}: ` : ''}{j.note}</p>
                                                ))}
                                            </div>
                                        )}

                                        {}
                                        {(firstJob.status === 'IN_PROGRESS' || firstJob.status === 'UPCOMING') && firstJob.date === todayISO && (
                                            <div className="flex gap-2 w-full mt-2">
                                                <button
                                                    onClick={() => router.push(`/volunteer/careu/jobs?map=true&jobId=${firstJob.id}`)}
                                                    className="w-full py-3 rounded-xl bg-brand-primary text-white text-base font-bold shadow-md hover:bg-brand-secondary active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    แผนที่นำทาง
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>

            {selectedJob && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-[90]" onClick={() => setSelectedJob(null)} />
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">รายละเอียดงาน</p>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{selectedJob.patientName}</h3>
                                    <p className="text-base text-gray-500">{selectedJob.hospital}{selectedJob.department ? ` • ${selectedJob.department}` : ''}</p>
                                    {selectedJob.jobStatus && (
                                        <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${getVolunteerJobStatusDisplay(selectedJob.jobStatus, selectedJob.returnPickupRequestedAt).color}`}>
                                            {getVolunteerJobStatusDisplay(selectedJob.jobStatus, selectedJob.returnPickupRequestedAt).label}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedJob.patientPhone && (
                                        <PhoneCallButton phone={selectedJob.patientPhone} label="โทรผู้รับบริการ" />
                                    )}
                                    <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="ปิด">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-3 text-base text-gray-700 dark:text-gray-200">
                                    <div>
                                        <p className="font-semibold">เวลา</p>
                                        <p className="mt-1">{selectedJob.time}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">การเคลื่อนไหว</p>
                                        <p className="mt-1">{(selectedJob.mobilityStatus && (MOBILITY_LABELS[selectedJob.mobilityStatus] || selectedJob.mobilityStatus)) || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">ระดับการดูแล</p>
                                        <p className="mt-1">{(selectedJob.severityLevel && (SEVERITY_LABELS[selectedJob.severityLevel] || selectedJob.severityLevel)) || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">อุปกรณ์</p>
                                        <p className="mt-1">{selectedJob.equipment || '-'}</p>
                                    </div>
                                </div>

                                {selectedJob.diseases && selectedJob.diseases.length > 0 && (
                                    <div className="mt-4">
                                        <p className="font-semibold">โรคประจำตัว</p>
                                        <ul className="list-disc pl-5 mt-2 space-y-1 text-base">
                                            {selectedJob.diseases.map((d, i) => <li key={`${d}-${i}`}>{d}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {selectedJob.note && (
                                    <div className="mt-4">
                                        <p className="font-semibold">หมายเหตุ</p>
                                        <p className="mt-1 text-base text-gray-700 dark:text-gray-200">{selectedJob.note}</p>
                                    </div>
                                )}

                                {selectedJob.driverName && (
                                    <div className="mt-4 border-t pt-3">
                                        <p className="font-semibold">บุคลากร</p>
                                        <div className="mt-2 flex items-center justify-between gap-3">
                                            <p className="text-base">{selectedJob.driverName}</p>
                                            {selectedJob.driverPhone && (
                                                <PhoneCallButton phone={selectedJob.driverPhone} label="โทรเจ้าหน้าที่ขับรถ" />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {selectedJob.jobStatus === 'AT_PATIENT_HOME' && (
                                <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                                    <div className="w-full py-3 rounded-xl bg-blue-50 border-2 border-blue-300 text-blue-700 text-base font-bold text-center flex items-center justify-center gap-2">
                                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                                        รอคนขับถ่ายรูปยืนยันส่งถึงบ้าน
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
