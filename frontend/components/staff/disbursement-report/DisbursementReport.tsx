'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { exportToExcel } from './exportUtils';

interface JobDetail {
    id: number;
    completedAt: string;
    patientName: string;
    hospitalName: string;
    distanceKm: number;
    bookingTime: string;
    vehicleName: string;
    cost: number;
}

interface Volunteer {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    completedJobs: number;
    totalDistance: number;
    disbursement: number;
    jobs: JobDetail[];
}

interface Summary {
    month: string;
    totalCompletedJobs: number;
    totalDriverJobs: number;
    totalCareUJobs: number;
    totalDistance: number;
    costPerCase: number;
    totalDisbursement: number;
    organizationName: string;
}

interface ReportData {
    summary: Summary;
    volunteers: Volunteer[];
}

const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const THAI_MONTHS_SHORT = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

function formatThaiMonth(month: string) {
    const [y, m] = month.split('-');
    return `${THAI_MONTHS[parseInt(m) - 1]} ${parseInt(y) + 543}`;
}

function ThaiMonthPicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (val: string) => void;
}) {
    const [y, m] = value.split('-').map(Number);
    const buddhistYear = y + 543;

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newY = parseInt(e.target.value) - 543;
        const mm = String(m).padStart(2, '0');
        onChange(`${newY}-${mm}`);
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newM = String(parseInt(e.target.value)).padStart(2, '0');
        onChange(`${y}-${newM}`);
    };

    return (
        <div className="flex items-center gap-1">
            <div className="relative">
                <select
                    value={buddhistYear}
                    onChange={handleYearChange}
                    className="appearance-none border border-slate-300 rounded-lg pl-3 pr-6 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white cursor-pointer"
                >
                    {years.map((yr) => (
                        <option key={yr} value={yr + 543}>
                            {yr + 543}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            <div className="relative">
                <select
                    value={m}
                    onChange={handleMonthChange}
                    className="appearance-none border border-slate-300 rounded-lg pl-3 pr-6 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white cursor-pointer"
                >
                    {THAI_MONTHS.map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                            {name}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

function formatCurrency(amount: number) {
    return Number(amount.toFixed(2)).toLocaleString('th-TH');
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function SummaryCard({
    title, value, subtitle, icon, gradient,
}: {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ReactNode;
    gradient: string;
}) {
    return (
        <div className={`rounded-2xl p-5 text-white shadow-lg ${gradient} relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/5 translate-y-6 -translate-x-4" />
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-90">
                    {icon}
                    <span className="text-sm font-medium">{title}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</div>
                {subtitle && <div className="text-xs mt-1 opacity-80">{subtitle}</div>}
            </div>
        </div>
    );
}

export default function DisbursementReport() {
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);

    const [viewMode, setViewMode] = useState<'MAIN' | 'DETAIL'>('MAIN');
    const [selectedVlt, setSelectedVlt] = useState<Volunteer | null>(null);

    const [exporting, setExporting] = useState<'excel' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const displayJobs = useMemo(() => {
        if (!selectedVlt) return [];
        const unique: any[] = [];
        const seen = new Set<string>();

        selectedVlt.jobs.forEach(job => {
            const dateStr = job.completedAt ? job.completedAt.split('T')[0] : 'nodate';
            const key = `${dateStr}_${job.bookingTime}_${job.hospitalName}`;

            if (!seen.has(key)) {
                seen.add(key);
                unique.push({ ...job });
            } else {
                const existing = unique.find(u => {
                    const uDate = u.completedAt ? u.completedAt.split('T')[0] : 'nodate';
                    return `${uDate}_${u.bookingTime}_${u.hospitalName}` === key;
                });
                if (existing && !existing.patientName.includes(job.patientName)) {
                    existing.patientName += `, ${job.patientName}`;
                }
            }
        });
        return unique;
    }, [selectedVlt]);

    const fetchReport = useCallback(async () => {
        try {
            setLoading(true);
            let url = `/jobs/disbursement-report?month=${selectedMonth}`;
            if (startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }
            const res = await fetchWithAuth(url);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error('Error fetching report:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, startDate, endDate]);

    useEffect(() => {
        if ((startDate && endDate) || (!startDate && !endDate && selectedMonth)) {
            fetchReport();
        }
    }, [fetchReport, startDate, endDate, selectedMonth]);

    const handleExportExcel = async () => {
        if (!data) return;
        setExporting('excel');
        try {
            await exportToExcel(data, selectedMonth);
        } finally {
            setExporting(null);
        }
    };



    const handleVolunteerClick = (vlt: Volunteer) => {
        setSelectedVlt(vlt);
        setSearchQuery(`${vlt.firstName} ${vlt.lastName}`);
        setViewMode('DETAIL');
        setCurrentPage(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToMain = () => {
        setViewMode('MAIN');
        setSelectedVlt(null);
        setSearchQuery('');
        setCurrentPage(1);
    };

    const isShowingDetails = viewMode === 'DETAIL' && selectedVlt && searchQuery === `${selectedVlt.firstName} ${selectedVlt.lastName}`;

    const renderVolunteerTable = (showTopHeader: boolean) => {
        if (!data) return null;

        const filteredVolunteers = searchQuery
            ? data.volunteers.filter(v => `${v.firstName} ${v.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
            : data.volunteers;

        const totalPages = Math.ceil(filteredVolunteers.length / ITEMS_PER_PAGE);
        const paginatedVolunteers = filteredVolunteers.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );

        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {showTopHeader && (
                    <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <h3 className="font-bold text-slate-800 text-base">
                            รายละเอียดจิตอาสา ({filteredVolunteers.length} คน)
                        </h3>
                        <div className="relative w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อจิตอาสา..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                )}

                {data.volunteers.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p>ไม่มีข้อมูลการทำงานในเดือนนี้</p>
                    </div>
                ) : filteredVolunteers.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <p>ไม่พบข้อมูลจิตอาสาที่ค้นหา</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-600">
                                    <th className="text-left px-5 py-3 font-semibold">ชื่อจิตอาสา</th>
                                    <th className="text-left px-5 py-3 font-semibold">บทบาท</th>
                                    <th className="text-center px-5 py-3 font-semibold">จำนวนเคส</th>
                                    <th className="text-right px-5 py-3 font-semibold">ระยะทาง (กม.)</th>
                                    <th className="text-center px-5 py-3 font-semibold w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedVolunteers.map((vlt, idx) => (
                                    <VolunteerRow
                                        key={vlt.id}
                                        vlt={vlt}
                                        index={((currentPage - 1) * ITEMS_PER_PAGE) + idx}
                                        onClick={() => handleVolunteerClick(vlt)}
                                    />
                                ))}
                            </tbody>
                            {!searchQuery && (
                                <tfoot>
                                    <tr className="bg-emerald-50 font-bold text-emerald-800 border-t-2 border-emerald-200">
                                        <td className="px-5 py-4" colSpan={2}>รวมทั้งหมด (จากทั้งหมด)</td>
                                        <td className="text-center px-5 py-4">{data.summary.totalCompletedJobs}</td>
                                        <td className="text-right px-5 py-4">{formatCurrency(Math.round(data.summary.totalDistance * 100) / 100)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-white">
                                <div className="text-sm text-slate-500">
                                    แสดง {((currentPage - 1) * ITEMS_PER_PAGE) + 1} ถึง {Math.min(currentPage * ITEMS_PER_PAGE, filteredVolunteers.length)} จาก {filteredVolunteers.length} คน
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 text-sm bg-white font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                    >
                                        ก่อนหน้า
                                    </button>
                                    <span className="text-sm font-medium text-slate-600">หน้า {currentPage}/{totalPages}</span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 text-sm bg-white font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                    >
                                        ถัดไป
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 pb-20 bg-gray-50 min-h-screen">
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">กำลังโหลดรายงาน...</p>
                    </div>
                </div>
            ) : !data ? (
                <div className="text-center py-32 text-slate-400">ไม่สามารถโหลดข้อมูลได้</div>
            ) : viewMode === 'MAIN' ? (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 mb-6">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">
                                        เดือน:
                                    </label>
                                    <ThaiMonthPicker
                                        value={selectedMonth}
                                        onChange={(val) => {
                                            setSelectedMonth(val);
                                            setStartDate('');
                                            setEndDate('');
                                        }}
                                    />
                                </div>

                                <div className="text-slate-300 hidden sm:block">|</div>

                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">
                                        ช่วงวันที่:
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                    <span className="text-slate-500">-</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleExportExcel}
                                    disabled={!data || loading || exporting !== null}
                                    className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    {exporting === 'excel' ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    )}
                                    Excel
                                </button>

                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-800">
                            {startDate && endDate
                                ? `รายงานการทำงาน — ${formatDate(startDate)} ถึง ${formatDate(endDate)}`
                                : `รายงานการทำงาน — ${formatThaiMonth(selectedMonth)}`}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">{data.summary.organizationName}</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        <SummaryCard
                            title="เคสเสร็จสิ้นทั้งหมด"
                            value={String(data.summary.totalCompletedJobs)}
                            subtitle="เคส"
                            gradient="bg-gradient-to-br from-emerald-600 to-emerald-800"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        />
                        <SummaryCard
                            title="เคสเจ้าหน้าที่รถ"
                            value={String(data.summary.totalDriverJobs)}
                            subtitle="เคส"
                            gradient="bg-gradient-to-br from-blue-500 to-blue-700"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
                        />
                        <SummaryCard
                            title="เคสแคร์ยู"
                            value={String(data.summary.totalCareUJobs)}
                            subtitle="เคส"
                            gradient="bg-gradient-to-br from-purple-500 to-purple-700"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                        />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div>
                            <span className="text-sm text-slate-500">ระยะทางรวมทั้งหมด</span>
                            <span className="ml-2 text-lg font-bold text-slate-800">{formatCurrency(Math.round(data.summary.totalDistance * 100) / 100)} กม.</span>
                        </div>
                    </div>

                    {renderVolunteerTable(true)}

                    <div className="mt-6 text-center text-xs text-slate-400">
                        พิมพ์วันที่ {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })} เวลา {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                    </div>
                </div>
            ) : (
                                <div className="animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 sm:p-3 mb-6 flex flex-col sm:flex-row items-center gap-3">
                        <button
                            onClick={handleBackToMain}
                            className="flex items-center justify-center gap-2 text-slate-600 hover:text-emerald-700 font-medium px-3 py-1.5 text-sm rounded-lg hover:bg-emerald-50 transition-colors shrink-0 w-full sm:w-auto border border-slate-200 sm:border-0"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            กลับสู่รายงานหลัก
                        </button>

                        <div className="hidden sm:block w-px h-6 bg-slate-200" />

                        <div className="relative flex-1 w-full text-sm">
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อจิตอาสาคนอื่น..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-9 pr-9 py-2 text-sm border border-slate-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm transition-shadow"
                            />
                            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchQuery && (
                                <button
                                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {isShowingDetails ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">
                                        รายละเอียดของ {selectedVlt.firstName} {selectedVlt.lastName}
                                    </h3>
                                    <div className="text-sm text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedVlt.role === 'DRIVE' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                            {selectedVlt.role === 'DRIVE' ? 'เจ้าหน้าที่รถ' : 'จิตอาสาแคร์ยู'}
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span>ให้บริการ {selectedVlt.completedJobs} เคส</span>
                                        <span className="text-slate-300">•</span>
                                        <span>ระยะทาง {formatCurrency(Math.round(selectedVlt.totalDistance * 100) / 100)} กม.</span>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-white text-slate-500 border-b border-slate-200">
                                            <th className="px-5 py-4 font-semibold text-left">วันที่</th>
                                            <th className="px-5 py-4 font-semibold text-left">ผู้ใช้บริการ</th>
                                            <th className="px-5 py-4 font-semibold text-left">โรงพยาบาล</th>
                                            <th className="px-5 py-4 font-semibold text-left">นัดหมาย</th>
                                            <th className="px-5 py-4 font-semibold text-right">ระยะทาง</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {displayJobs.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-12 text-center text-slate-500">ไม่มีข้อมูลเคส</td>
                                            </tr>
                                        ) : (
                                            displayJobs.map((job, jIdx) => (
                                                <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-5 py-4 font-medium text-slate-700">{job.completedAt ? formatDate(job.completedAt) : '-'}</td>
                                                    <td className="px-5 py-4 font-semibold text-slate-800">{job.patientName}</td>
                                                    <td className="px-5 py-4 text-slate-600 truncate max-w-[200px]">{job.hospitalName}</td>
                                                    <td className="px-5 py-4 text-slate-600">{job.bookingTime}</td>
                                                    <td className="px-5 py-4 text-right font-medium text-slate-700">
                                                        {job.distanceKm > 0 ? `${(Math.round(job.distanceKm * 100) / 100)} กม.` : '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        renderVolunteerTable(false)
                    )}
                </div>
            )}
        </div>
    );
}

function VolunteerRow({
    vlt, index, onClick,
}: {
    vlt: Volunteer;
    index: number;
    onClick: () => void;
}) {
    const roleBadge = vlt.role === 'DRIVE'
        ? { label: 'เจ้าหน้าที่ขับรถ', bg: 'bg-blue-100', text: 'text-blue-700' }
        : { label: 'จิตอาสาแคร์ยู', bg: 'bg-purple-100', text: 'text-purple-700' };

    return (
        <tr
            className={`hover:bg-slate-50 cursor-pointer transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
            onClick={onClick}
        >
            <td className="px-5 py-3.5 font-medium text-slate-800">
                {vlt.firstName} {vlt.lastName}
            </td>
            <td className="px-5 py-3.5">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge.bg} ${roleBadge.text}`}>
                    {roleBadge.label}
                </span>
            </td>
            <td className="text-center px-5 py-3.5 font-semibold">{vlt.completedJobs}</td>
            <td className="text-right px-5 py-3.5">{formatCurrency(Math.round(vlt.totalDistance * 100) / 100)}</td>
            <td className="text-center px-3 py-3.5">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </td>
        </tr>
    );
}
