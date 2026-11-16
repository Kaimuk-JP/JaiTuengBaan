'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/lib/auth';


interface PatientDetailProps {
    patientId: string;
}

export default function PatientDetail({ patientId }: PatientDetailProps) {
    const { user } = useAuth();
    const [patient, setPatient] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        const fetchPatientDetails = async () => {
            try {
                setIsLoading(true);
                const res = await fetchWithAuth(`/jobs/assigned-to/${user.id}`);
                if (!res.ok) throw new Error('API fetch failed');
                const jobs = await res.json();

                const patientJobs = jobs.filter((j: any) => j.queue?.user?.id === patientId);

                if (patientJobs.length > 0) {
                    patientJobs.sort((a: any, b: any) => {
                        const dateA = a.queue?.requestDate ? new Date(a.queue.requestDate).getTime() : 0;
                        const dateB = b.queue?.requestDate ? new Date(b.queue.requestDate).getTime() : 0;
                        return dateB - dateA;
                    });

                    const latestJob = patientJobs[0];
                    const u = latestJob.queue.user;

                    setPatient({
                        id: u.id,
                        firstName: u.firstName || 'ไม่มีชื่อ',
                        lastName: u.lastName || '',
                        age: u.birthDate ? Math.floor((new Date().getTime() - new Date(u.birthDate).getTime()) / 31557600000) : '-',
                        diseases: Array.isArray(u.diseases) && u.diseases.length > 0
                            ? u.diseases.map((d: any) => d.disease?.name || d.name || 'ไม่ระบุ')
                            : (u.customDiseases ? [u.customDiseases] : ['ไม่มีโรคประจำตัว']),
                        mobility: u.mobilityStatus || 'ปกติ',
                        allergies: u.allergies || 'ไม่มี',
                        emergencyContactName: u.relativeName || 'ไม่มีข้อมูลติดต่อ',
                        emergencyContactPhone: u.relativePhone || '-',
                        careCount: patientJobs.length,
                        address: [
                            u.addressDetail,
                            u.villageName ? `หมู่บ้าน ${u.villageName}` : null,
                            u.subdistrictName ? `ต.${u.subdistrictName}` : null,
                            u.districtName ? `อ.${u.districtName}` : null,
                            u.provinceName ? `จ.${u.provinceName}` : null
                        ].filter(Boolean).join(' ') || 'ไม่มีข้อมูลที่อยู่',
                        history: patientJobs.map((j: any) => ({
                            id: j.id,
                            date: j.queue?.requestDate ? new Date(j.queue.requestDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-',
                            place: j.queue?.hospital?.name || j.queue?.hospitalName || 'ไม่ระบุสถานที่',
                            careu: j.careuId === user.id ? user.firstName : 'เจ้าหน้าที่ท่านอื่น'
                        })),
                        pictureUrl: u.pictureUrl || null
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatientDetails();
    }, [user?.id, patientId]);

    if (isLoading) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center bg-[#F5F5F5] dark:bg-gray-900">
                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-brand-primary"></div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#F5F5F5] dark:bg-gray-900 px-5 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">ไม่พบข้อมูลประชาชน</h2>
                <Link href="/volunteer/careu/patients" className="mt-4 bg-brand-primary text-white px-6 py-2 rounded-full font-semibold hover:bg-brand-primary/90 transition-colors">
                    กลับไปหน้ารายการ
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#F5F5F5] dark:bg-gray-900 font-sans pb-10">
            { }
            <div className="bg-gradient-to-bl from-[#3AAE7D] to-[#346D55] dark:from-slate-800 dark:to-slate-900 pb-16 text-white px-5 pt-6 rounded-b-[2.5rem] shadow-sm">
                <div className="flex items-center gap-3 relative z-10">
                    <Link href="/volunteer/careu/patients" className="p-2 -ml-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-xl font-bold">ข้อมูลประชาชน</h1>
                </div>

                <div className="mt-8 flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-white text-[#1E7D55] shadow-lg flex items-center justify-center font-bold text-4xl mb-3 border-4 border-white/20 overflow-hidden">
                        {patient.pictureUrl ? (
                            <img src={patient.pictureUrl} alt="profile rounded-full w-full h-full object-cover" />
                        ) : (
                            patient.firstName.charAt(0)
                        )}
                    </div>
                    <h2 className="text-2xl font-bold">คุณ {patient.firstName} {patient.lastName}</h2>
                    <p className="opacity-90 mt-1">อายุ {patient.age} ปี • {patient.mobility}</p>
                </div>
            </div>

            { }
            <div className="px-5 -mt-6 relative z-10 max-w-md mx-auto space-y-4">

                { }
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm shadow-black/5">
                    <div className="flex items-center gap-2 mb-4 text-[#1E7D55] dark:text-green-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">ข้อมูลสุขภาพ</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex flex-col">
                            <span className="text-sm text-gray-500">โรคประจำตัว</span>
                            <span className="font-semibold text-red-500">{patient.diseases.join(', ')}</span>
                        </div>
                    </div>
                </div>

                { }
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm shadow-black/5">
                    <div className="flex items-center gap-2 mb-4 text-orange-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">ผู้ติดต่อฉุกเฉิน (ญาติ)</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-gray-100">{patient.emergencyContactName}</h4>
                                <p className="text-sm text-gray-500">{patient.emergencyContactPhone}</p>
                            </div>
                            <a href={`tel:${patient.emergencyContactPhone.replace(/-/g, '')}`} className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                            </a>
                        </div>
                        <div className="flex flex-col mt-2">
                            <span className="text-sm text-gray-500">ที่อยู่</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200 leading-relaxed text-sm">{patient.address}</span>
                        </div>
                    </div>
                </div>

                { }
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm shadow-black/5">
                    <div className="flex items-center gap-2 mb-4 text-blue-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">ประวัติการดูแล</h3>
                    </div>

                    <div className="relative border-l-2 border-gray-100 dark:border-gray-700 ml-3 space-y-6">
                        {patient.history.map((record: any, index: number) => (
                            <div key={record.id} className="relative pl-6">
                                <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                <div className="text-sm text-gray-500 mb-0.5">{record.date}</div>
                                <div className="font-bold text-gray-800 dark:text-gray-200">{record.place}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    จิตอาสาแคร์ยู: {record.careu}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
