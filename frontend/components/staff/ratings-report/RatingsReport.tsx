'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import type { SelectedPerson, Tab } from '@/types/common';

const PER_PAGE = 20;

interface RatedJob {
    jobId: number;
    score: number;
    comment: string | null;
    patientName: string;
    completedAt: string;
}

interface DriverRating {
    id: string;
    name: string;
    avgScore: number;
    totalRatings: number;
    jobs: RatedJob[];
}

interface CareuRating {
    id: string;
    name: string;
    avgScore: number;
    totalRatings: number;
    jobs: RatedJob[];
}

interface MunicipalAverages {
    punctuality: number;
    bookingEase: number;
    vehicleClean: number;
    safety: number;
    staffAttitude: number;
    overallScore: number;
}

interface MunicipalRating {
    id: number;
    jobId: number;
    userName: string;
    punctuality: number;
    bookingEase: number;
    vehicleClean: number;
    safety: number;
    staffAttitude: number;
    overallScore: number;
    comment: string | null;
    createdAt: string;
}

interface RatingsData {
    organizationName: string;
    summary: {
        totalDriverRatings: number;
        avgDriverScore: number;
        totalCareuRatings: number;
        avgCareuScore: number;
        totalMunicipalRatings: number;
        avgMunicipalScore: number;
    };
    drivers: DriverRating[];
    careus: CareuRating[];
    municipal: {
        averages: MunicipalAverages;
        ratings: MunicipalRating[];
    };
}

function StarDisplay({ score, max = 5 }: { score: number; max?: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: max }, (_, i) => (
                <svg
                    key={i}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={i < Math.round(score) ? '#f59e0b' : 'none'}
                    stroke={i < Math.round(score) ? '#f59e0b' : '#d1d5db'}
                    strokeWidth="2"
                >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ))}
            <span className="ml-1 text-sm font-semibold text-text-primary">{score}</span>
        </div>
    );
}

function ScoreBar({ label, score, color, maxScore = 5 }: { label: string; score: number; color: string; maxScore?: number }) {
    const pct = (score / maxScore) * 100;
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary w-44 shrink-0">{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-bold text-text-primary w-8 text-right">{score}</span>
        </div>
    );
}

function ScoreLabel({ score }: { score: number }) {
    let mappedScore = score;
    if (score > 3) mappedScore = 3;
    else if (score > 1.5 && score <= 3) mappedScore = 2;
    else if (score <= 1.5) mappedScore = 1;

    mappedScore = score <= 3 ? score : Math.ceil(score / 2);

    const displayScore = Number.isInteger(mappedScore) ? mappedScore.toString() : mappedScore.toFixed(1);

    let info = { text: 'ดี', bg: 'bg-green-100', text_color: 'text-green-600' };
    if (mappedScore < 1.5) {
        info = { text: 'แย่', bg: 'bg-red-100', text_color: 'text-red-600' };
    } else if (mappedScore < 2.5) {
        info = { text: 'ปานกลาง', bg: 'bg-amber-100', text_color: 'text-amber-600' };
    }

    return (
        <div className="flex items-center gap-1.5">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.bg} ${info.text_color}`}>
                {info.text}
            </span>
            <span className="text-sm font-bold text-text-primary">{displayScore}/3</span>
        </div>
    );
}

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) {
    if (totalPages <= 1) return null;

    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage > 3) pages.push('...');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pages.push(i);
        }
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
    }

    return (
        <div className="flex items-center justify-center gap-1 pt-4">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-text-secondary hover:bg-slate-50 dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                ก่อนหน้า
            </button>
            {pages.map((p, i) =>
                p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-text-tertiary">...</span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`min-w-[36px] px-2 py-1.5 text-sm rounded-lg transition-colors ${
                            currentPage === p
                                ? 'bg-brand-primary text-white font-semibold'
                                : 'border border-slate-200 dark:border-slate-700 text-text-secondary hover:bg-slate-50 dark:bg-slate-800'
                        }`}
                    >
                        {p}
                    </button>
                )
            )}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-text-secondary hover:bg-slate-50 dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                ถัดไป
            </button>
        </div>
    );
}

type TabId = 'municipal' | 'driver' | 'careu';

export default function RatingsReport() {
    const [data, setData] = useState<RatingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [subTab, setSubTab] = useState<TabId>('municipal');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [municipalPage, setMunicipalPage] = useState(1);
    const [driverPage, setDriverPage] = useState(1);
    const [careuPage, setCareuPage] = useState(1);

    const [selectedPerson, setSelectedPerson] = useState<SelectedPerson | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const handleTabChange = (tab: TabId) => {
        setSubTab(tab);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            let url = '/jobs/ratings-report';
            const params = new URLSearchParams();
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);
            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetchWithAuth(url);
            if (res.ok) {
                setData(await res.json());
                setMunicipalPage(1);
                setDriverPage(1);
                setCareuPage(1);
            }
        } catch (e) {
            console.error('Error loading ratings:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!data) {
        return <div className="text-center py-12 text-text-tertiary">ไม่สามารถโหลดข้อมูลได้</div>;
    }

    const municipalCriteria = [
        { key: 'punctuality', label: 'ความตรงต่อเวลา' },
        { key: 'bookingEase', label: 'ความสะดวกในการจองคิว' },
        { key: 'vehicleClean', label: 'ความสะอาดของรถ' },
        { key: 'safety', label: 'ความปลอดภัย' },
        { key: 'staffAttitude', label: 'ความเอาใจใส่ของเจ้าหน้าที่' },
        { key: 'overallScore', label: 'ความพึงพอใจโดยรวม' },
    ];

    const tabs: Tab<TabId>[] = [
        { id: 'municipal', label: 'เทศบาล', count: data.summary.totalMunicipalRatings },
        { id: 'driver', label: 'เจ้าหน้าที่รถ', count: data.summary.totalDriverRatings },
        { id: 'careu', label: 'จิตอาสาแคร์ยู', count: data.summary.totalCareuRatings },
    ];

    const municipalTotal = data.municipal.ratings.length;
    const municipalTotalPages = Math.ceil(municipalTotal / PER_PAGE);
    const municipalPaged = data.municipal.ratings.slice((municipalPage - 1) * PER_PAGE, municipalPage * PER_PAGE);

    const driverTotal = data.drivers.length;
    const driverTotalPages = Math.ceil(driverTotal / PER_PAGE);
    const driverPaged = data.drivers.slice((driverPage - 1) * PER_PAGE, driverPage * PER_PAGE);

    const careuTotal = data.careus.length;
    const careuTotalPages = Math.ceil(careuTotal / PER_PAGE);
    const careuPaged = data.careus.slice((careuPage - 1) * PER_PAGE, careuPage * PER_PAGE);

    return (
        <div className="p-4 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">จากวันที่</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            onClick={(e) => e.currentTarget.showPicker()}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">ถึงวันที่</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            onClick={(e) => e.currentTarget.showPicker()}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-btn-hover transition-colors"
                    >
                        ค้นหา
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800/50">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">เทศบาล</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                            {data.summary.avgMunicipalScore ? (Number.isInteger(data.summary.avgMunicipalScore) ? data.summary.avgMunicipalScore : Number(data.summary.avgMunicipalScore).toFixed(1)) : '-'}
                        </span>
                        <span className="text-sm text-blue-500 dark:text-blue-400/80">/ 5</span>
                    </div>
                    <p className="text-xs text-blue-500 dark:text-blue-400/80 mt-1">{data.summary.totalMunicipalRatings} รายการประเมิน</p>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/40 dark:to-teal-900/20 rounded-2xl p-4 border border-teal-200 dark:border-teal-800/50">
                    <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-1">เจ้าหน้าที่รถ</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-teal-700 dark:text-teal-300">
                            {data.summary.avgDriverScore ? (
                                Number.isInteger(data.summary.avgDriverScore > 3 ? Math.ceil(data.summary.avgDriverScore / 2) : data.summary.avgDriverScore)
                                    ? (data.summary.avgDriverScore > 3 ? Math.ceil(data.summary.avgDriverScore / 2) : data.summary.avgDriverScore)
                                    : Number(data.summary.avgDriverScore > 3 ? data.summary.avgDriverScore / 5 * 3 : data.summary.avgDriverScore).toFixed(1)
                            ) : '-'}
                        </span>
                        <span className="text-sm text-teal-500 dark:text-teal-400/80">/ 3</span>
                    </div>
                    <p className="text-xs text-teal-500 dark:text-teal-400/80 mt-1">{data.summary.totalDriverRatings} รายการประเมิน</p>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/40 dark:to-pink-900/20 rounded-2xl p-4 border border-pink-200 dark:border-pink-800/50">
                    <p className="text-xs font-medium text-pink-600 dark:text-pink-400 mb-1">จิตอาสาแคร์ยู</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-pink-700 dark:text-pink-300">
                            {data.summary.avgCareuScore ? (
                                Number.isInteger(data.summary.avgCareuScore > 3 ? Math.ceil(data.summary.avgCareuScore / 2) : data.summary.avgCareuScore)
                                    ? (data.summary.avgCareuScore > 3 ? Math.ceil(data.summary.avgCareuScore / 2) : data.summary.avgCareuScore)
                                    : Number(data.summary.avgCareuScore > 3 ? data.summary.avgCareuScore / 5 * 3 : data.summary.avgCareuScore).toFixed(1)
                            ) : '-'}
                        </span>
                        <span className="text-sm text-pink-500 dark:text-pink-400/80">/ 3</span>
                    </div>
                    <p className="text-xs text-pink-500 dark:text-pink-400/80 mt-1">{data.summary.totalCareuRatings} รายการประเมิน</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${subTab === tab.id
                                ? 'text-brand-primary'
                                : 'text-text-tertiary hover:text-text-primary hover:bg-slate-50 dark:bg-slate-800'
                                }`}
                        >
                            {tab.label} ({tab.count})
                            {subTab === tab.id && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-primary rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-4">
                    {subTab === 'municipal' && (
                        <div className="space-y-4">
                            {data.summary.totalMunicipalRatings > 0 ? (
                                <>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
                                        <h3 className="text-sm font-bold text-text-primary mb-2">คะแนนเฉลี่ยรายด้าน</h3>
                                        {municipalCriteria.map((c) => (
                                            <ScoreBar
                                                key={c.key}
                                                label={c.label}
                                                score={data.municipal.averages[c.key as keyof typeof data.municipal.averages]}
                                                color={c.key === 'overallScore' ? 'bg-amber-400' : 'bg-blue-400'}
                                            />
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-text-primary">รายการประเมินทั้งหมด</h3>
                                        <span className="text-xs text-text-tertiary">
                                            แสดง {(municipalPage - 1) * PER_PAGE + 1}-{Math.min(municipalPage * PER_PAGE, municipalTotal)} จาก {municipalTotal} รายการ
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {municipalPaged.map((r) => (
                                            <div key={r.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="text-sm font-medium text-text-primary">{r.userName || 'ไม่ระบุ'}</p>
                                                        <p className="text-xs text-text-tertiary">
                                                            งาน #{r.jobId} | {new Date(r.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <StarDisplay score={r.overallScore} />
                                                </div>
                                                {r.comment && (
                                                    <p className="text-xs text-text-secondary bg-white dark:bg-slate-800 rounded-lg p-2 mt-1 border border-slate-100">
                                                        &ldquo;{r.comment}&rdquo;
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <Pagination currentPage={municipalPage} totalPages={municipalTotalPages} onPageChange={setMunicipalPage} />
                                </>
                            ) : (
                                <div className="text-center py-8 text-text-tertiary text-sm">ยังไม่มีข้อมูลการประเมินเทศบาล</div>
                            )}
                        </div>
                    )}

                    {subTab === 'driver' && (
                        <div className="space-y-2">
                            {data.drivers.length > 0 ? (
                                <>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-text-tertiary">
                                            แสดง {(driverPage - 1) * PER_PAGE + 1}-{Math.min(driverPage * PER_PAGE, driverTotal)} จาก {driverTotal} คน
                                        </span>
                                    </div>
                                    {driverPaged.map((d) => (
                                        <button
                                            key={d.id}
                                            onClick={() => setSelectedPerson({ ...d, type: 'driver' })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl p-4 flex justify-between items-center transition-colors text-left"
                                        >
                                            <div>
                                                <p className="font-semibold text-text-primary">{d.name || 'ไม่ระบุชื่อ'}</p>
                                                <p className="text-xs text-text-tertiary">{d.totalRatings} รายการประเมิน</p>
                                            </div>
                                            <ScoreLabel score={d.avgScore} />
                                        </button>
                                    ))}
                                    <Pagination currentPage={driverPage} totalPages={driverTotalPages} onPageChange={setDriverPage} />
                                </>
                            ) : (
                                <div className="text-center py-8 text-text-tertiary text-sm">ยังไม่มีข้อมูลการประเมินเจ้าหน้าที่รถ</div>
                            )}
                        </div>
                    )}

                    {subTab === 'careu' && (
                        <div className="space-y-2">
                            {data.careus.length > 0 ? (
                                <>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-text-tertiary">
                                            แสดง {(careuPage - 1) * PER_PAGE + 1}-{Math.min(careuPage * PER_PAGE, careuTotal)} จาก {careuTotal} คน
                                        </span>
                                    </div>
                                    {careuPaged.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedPerson({ ...c, type: 'careu' })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl p-4 flex justify-between items-center transition-colors text-left"
                                        >
                                            <div>
                                                <p className="font-semibold text-text-primary">{c.name || 'ไม่ระบุชื่อ'}</p>
                                                <p className="text-xs text-text-tertiary">{c.totalRatings} รายการประเมิน</p>
                                            </div>
                                            <ScoreLabel score={c.avgScore} />
                                        </button>
                                    ))}
                                    <Pagination currentPage={careuPage} totalPages={careuTotalPages} onPageChange={setCareuPage} />
                                </>
                            ) : (
                                <div className="text-center py-8 text-text-tertiary text-sm">ยังไม่มีข้อมูลการประเมินจิตอาสาแคร์ยู</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {selectedPerson && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPerson(null)}>
                    <div
                        className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                            <div>
                                <h3 className="font-bold text-text-primary text-lg">{selectedPerson.name}</h3>
                                <p className="text-xs text-text-tertiary">
                                    {selectedPerson.type === 'driver' ? 'เจ้าหน้าที่ขับรถ' : 'จิตอาสาแคร์ยู'} · {selectedPerson.totalRatings} รายการประเมิน
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <ScoreLabel score={selectedPerson.avgScore} />
                                <button
                                    onClick={() => setSelectedPerson(null)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-text-tertiary"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
                            {selectedPerson.jobs.length > 0 ? selectedPerson.jobs.map((j: any) => (
                                <div key={j.jobId} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">#{j.jobId} {j.patientName}</p>
                                        <p className="text-xs text-text-tertiary">
                                            {new Date(j.completedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                        {j.comment && (
                                            <p className="text-xs text-text-secondary mt-1">&ldquo;{j.comment}&rdquo;</p>
                                        )}
                                    </div>
                                    <ScoreLabel score={j.score} />
                                </div>
                            )) : (
                                <div className="text-center py-6 text-text-tertiary text-sm">ไม่มีรายการประเมิน</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
