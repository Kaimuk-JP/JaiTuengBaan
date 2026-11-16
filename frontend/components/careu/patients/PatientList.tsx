'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import CareUSidebar from '@/components/careu/Sidebar/CareUSidebar';
import CareUHeader from '@/components/careu/Header/CareUHeader';
import Swal from '@/lib/swal';


interface PatientListItem {
    id: string;
    firstName: string;
    lastName: string;
    age: number | string;
    diseases: string[];
    mobility: string;
    careCount: number;
    lastVisit: string;
    pictureUrl: string | null;
}

export default function PatientList() {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [patients, setPatients] = useState<PatientListItem[]>([]);

    useEffect(() => {
        if (!user?.id) return;
        const fetchPatientsFromJobs = async () => {
            try {
                setIsLoading(true);
                const res = await fetchWithAuth(`/jobs/assigned-to/${user.id}`);
                if (!res.ok) throw new Error('Failed to fetch jobs');
                const data = await res.json();

                const patientMap = new Map<string, PatientListItem>();

                data.forEach((job: any) => {
                    const queue = job.queue;
                    if (!queue || !queue.user) return;

                    const u = queue.user;
                    const patientId = u.id;
                    const existing = patientMap.get(patientId);

                    const hospitalName = queue.hospital?.name || queue.hospitalName || 'โรงพยาบาล';

                    if (existing) {
                        existing.careCount += 1;
                        if (queue.requestDate) {
                            existing.lastVisit = hospitalName;
                        }
                    } else {
                        patientMap.set(patientId, {
                            id: patientId,
                            firstName: u.firstName || 'ไม่มีชื่อ',
                            lastName: u.lastName || '',
                            age: '-',
                            diseases: Array.isArray(u.diseases) && u.diseases.length > 0
                                ? u.diseases.map((d: any) => d.disease?.name || d.name || 'ไม่ระบุ')
                                : (u.customDiseases ? [u.customDiseases] : ['ไม่มีโรคประจำตัว']),
                            mobility: u.mobilityStatus || 'ปกติ',
                            careCount: 1,
                            lastVisit: hospitalName,
                            pictureUrl: u.pictureUrl || null,
                        });
                    }
                });

                setPatients(Array.from(patientMap.values()));
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatientsFromJobs();
    }, [user?.id]);
    const filteredPatients = patients.filter(p =>
        p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-[100dvh] h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#F5F5F5] dark:bg-gray-900 font-sans pb-24">
            <CareUSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            { }
            <div className="bg-gradient-to-bl from-[#3AAE7D] to-[#346D55] dark:from-slate-800 dark:to-slate-900 text-white">
                <CareUHeader user={null} onToggleSidebar={() => setSidebarOpen(true)} iconColor="white" />
            </div>

            { }
            <div className="px-5 mt-4 relative z-10 max-w-md mx-auto">
                { }
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อประชาชน..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary sm:text-sm transition-colors shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                { }
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-brand-primary"></div>
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">ไม่พบข้อมูลประชาชน</p>
                        </div>
                    ) : (
                        filteredPatients.map((patient) => (
                            <Link href={`/volunteer/careu/patients/${patient.id}`} key={patient.id} className="block border border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-sm shadow-black/5 hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                                <div className="flex gap-4">
                                    <div className="w-14 h-14 rounded-full bg-[#E8F3EF] text-[#1E7D55] flex items-center justify-center font-bold text-xl shrink-0">
                                        {patient.pictureUrl ? (
                                            <img src={patient.pictureUrl} alt="profile" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            patient.firstName.charAt(0)
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-800 dark:text-white text-base">คุณ {patient.firstName} {patient.lastName}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">อายุ {patient.age} ปี • {patient.mobility}</p>
                                            </div>
                                            <span className="bg-[#E8F3EF] dark:bg-green-900/30 text-[#1E7D55] dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">
                                                ดูแลแล้ว {patient.careCount} ครั้ง
                                            </span>
                                        </div>

                                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex items-start gap-1">
                                                <span className="font-semibold shrink-0 text-red-500">โรคประจำตัว:</span>
                                                <span className="line-clamp-1">{patient.diseases.join(', ')}</span>
                                            </div>
                                            <div className="flex items-start gap-1 mt-1">
                                                <span className="font-semibold shrink-0 text-blue-600">ล่าสุดไป:</span>
                                                <span className="line-clamp-1 text-gray-500">{patient.lastVisit}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
