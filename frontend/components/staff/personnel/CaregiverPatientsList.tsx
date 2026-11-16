'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import Image from 'next/image';

interface Patient {
    id: number;
    patientId: number;
    patientName: string;
    patientPictureUrl?: string;
    patientPhone: string;
    relationship: string;
    mobilityStatus: string;
    status: string;
    createdAt: string;
}

interface CaregiverPatientsListProps {
    caregiverId: number;
}

const relationshipLabels: Record<string, string> = {
    'FAMILY': 'ครอบครัว',
    'RELATIVE': 'ญาติ',
    'CLOSE_PERSON': 'คนใกล้ชิด',
};

const statusLabels: Record<string, string> = {
    'PENDING': 'รอตรวจสอบ',
    'APPROVED': 'อนุมัติ',
    'REJECTED': 'ปฏิเสธ',
};

const statusColors: Record<string, string> = {
    'PENDING': 'bg-amber-100 text-amber-700',
    'APPROVED': 'bg-green-100 text-green-700',
    'REJECTED': 'bg-red-100 text-red-700',
};

const mobilityLabels: Record<string, string> = {
    'WALKING': 'ทั่วไป',
    'WHEELCHAIR': 'ต้องดูแลเพิ่ม',
    'BEDRIDDEN': 'ต้องดูแลใกล้ชิด',
};

const mobilityColors: Record<string, string> = {
    'WALKING': 'bg-take-soft text-take-dark',
    'WHEELCHAIR': 'bg-saffron-light-soft text-saffron-dark',
    'BEDRIDDEN': 'bg-fuan-light text-fuan-dark',
};

export default function CaregiverPatientsList({ caregiverId }: CaregiverPatientsListProps) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPatients();
    }, [caregiverId]);

    const fetchPatients = async () => {
        try {
            const response = await fetchWithAuth(`/caregiver/${caregiverId}/patients`);
            if (response.ok) {
                const result = await response.json();
                const data = Array.isArray(result) ? result : (result.data || []);
                const filteredData = data.filter((p: any) => p.status === 'PENDING' || p.status === 'APPROVED');
                setPatients(filteredData);
            }
        } catch (error) {
            console.error('Error fetching caregiver patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(patient => {
        return patient.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.patientPhone.includes(searchQuery);
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-[1.75rem] font-normal text-text-primary leading-[140%] mb-4">
                ประชาชนในความดูแล
            </h3>

            { }
            <div className="mb-4">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="ค้นหาด้วยชื่อ หรือ เบอร์โทร"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                    />
                </div>
            </div>

            { }
            {filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-text-tertiary">
                    ยังไม่มีประชาชนในความดูแล
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredPatients.map((patient) => (
                        <div key={patient.id} className="border border-border-default rounded-xl p-4 flex items-center gap-4">
                            { }
                            <div className="w-14 h-14 rounded-full bg-fuji-light flex items-center justify-center overflow-hidden border border-border-default flex-shrink-0">
                                {patient.patientPictureUrl ? (
                                    <Image
                                        src={patient.patientPictureUrl}
                                        alt={patient.patientName}
                                        width={56}
                                        height={56}
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <svg className="w-8 h-8 text-text-placeholder" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                )}
                            </div>

                            { }
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-text-primary truncate">
                                    {patient.patientName}
                                </p>
                                <p className="text-sm text-text-tertiary">
                                    {patient.patientPhone}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-xs text-text-tertiary">
                                        สถานะความสัมพันธ์: {relationshipLabels[patient.relationship] || patient.relationship}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${mobilityColors[patient.mobilityStatus] || 'bg-gray-100'}`}>
                                        {mobilityLabels[patient.mobilityStatus] || patient.mobilityStatus}
                                    </span>
                                </div>
                            </div>

                            { }
                            <div className="flex-shrink-0">
                                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[patient.status] || 'bg-gray-100'}`}>
                                    {statusLabels[patient.status] || patient.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
