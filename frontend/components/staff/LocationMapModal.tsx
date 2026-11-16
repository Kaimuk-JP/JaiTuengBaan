'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import PatientInfoCard from './PatientInfoCard';
import VolunteerInfoCard from './VolunteerInfoCard';
import type { ContactPerson } from '@/types/common';

const JobTrackingMap = dynamic(() => import('@/components/staff/JobTrackingMap'), { ssr: false });

const ACTIVE_JOB_STATUSES = new Set([
    'ASSIGNED',
    'ACCEPTED',
    'PICKING_UP',
    'IN_PROGRESS',
    'IN_TRANSIT',
    'AT_HOSPITAL',
    'AT_PATIENT_HOME',
    'RETURN_HOME',
    'RETURN_OFFICE',
]);

interface Queue {
    id: number;
    user: {
        id: number;
        displayName: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        addressDetail?: string;
        lat?: number;
        lng?: number;
        mobilityStatus?: string;
        pictureUrl?: string;
    };
    hospitalName: string;
    hospital?: {
        id?: number;
        name?: string;
        lat?: number;
        lng?: number;
    };
    requestDate: string;
    bookingTime?: string;
    job?: {
        id: number;
        status: string;
        vltId?: number;
        vlt?: {
            id: number;
            displayName: string;
            firstName?: string;
            lastName?: string;
            phone?: string;
            lat?: number;
            lng?: number;
        };
    };
}

interface LocationMapModalProps {
    queue: Queue;
    onClose: () => void;
}

export default function LocationMapModal({ queue, onClose }: LocationMapModalProps) {
    const [volunteerInfo, setVolunteerInfo] = useState<ContactPerson | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [currentJobStatus, setCurrentJobStatus] = useState(queue.job?.status);
    const [hospitalLatLng, setHospitalLatLng] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    useEffect(() => {
        const hospital = queue.hospital;
        if (typeof hospital?.lat === 'number' && typeof hospital?.lng === 'number') {
            setHospitalLatLng({ lat: hospital.lat, lng: hospital.lng });
        }
    }, [queue.hospital]);

    useEffect(() => {
        if (!queue.job?.id) return;

        const fetchJobData = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${queue.job?.id}`, {
                    credentials: 'include',
                });
                if (!response.ok) return;

                const jobData = await response.json();
                setCurrentJobStatus(jobData.status);

                if (jobData.vlt) {
                    setVolunteerInfo({
                        displayName: jobData.vlt.displayName,
                        firstName: jobData.vlt.firstName,
                        lastName: jobData.vlt.lastName,
                        phone: jobData.vlt.phone,
                    });
                }

                const hosp = jobData.queue?.hospital;
                if (typeof hosp?.lat === 'number' && typeof hosp?.lng === 'number') {
                    setHospitalLatLng({ lat: hosp.lat, lng: hosp.lng });
                }
            } catch (error) {
                console.error('Error fetching job data:', error);
            }
        };

        fetchJobData();
        const interval = setInterval(fetchJobData, 10000);
        return () => clearInterval(interval);
    }, [queue.job?.id]);

    useEffect(() => {
        if (!volunteerInfo && queue.job?.vlt) {
            setVolunteerInfo({
                displayName: queue.job.vlt.displayName,
                firstName: queue.job.vlt.firstName,
                lastName: queue.job.vlt.lastName,
                phone: queue.job.vlt.phone,
            });
        }
    }, [queue.job?.vlt, volunteerInfo]);

    const patientLatLng = useMemo(() => {
        const lat = queue.user.lat;
        const lng = queue.user.lng;
        if (typeof lat === 'number' && typeof lng === 'number') {
            return { lat, lng };
        }
        return null;
    }, [queue.user.lat, queue.user.lng]);

    const jobStatus = currentJobStatus || queue.job?.status;
    const isLive = Boolean(jobStatus && ACTIVE_JOB_STATUSES.has(jobStatus));
    const jobId = queue.job?.id;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-green-50 to-blue-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">ตำแหน่งประชาชนและจิตอาสา</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 relative p-4">
                        {isMounted && jobId ? (
                            <JobTrackingMap
                                jobId={jobId}
                                jobStatus={jobStatus}
                                patientLatLng={patientLatLng}
                                hospitalLatLng={hospitalLatLng}
                                isLive={isLive}
                                patientPictureUrl={queue.user.pictureUrl}
                                patientName={
                                    [queue.user.firstName, queue.user.lastName].filter(Boolean).join(' ').trim()
                                    || queue.user.displayName
                                    || undefined
                                }
                                className="h-full w-full min-h-[320px]"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-slate-100 rounded-xl">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
                                    <p className="text-slate-600">กำลังโหลดแผนที่...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-2/5 bg-slate-50 border-l border-slate-200 overflow-y-auto">
                        <div className="p-6 space-y-4">
                            <PatientInfoCard
                                user={queue.user}
                                hospitalName={queue.hospitalName}
                            />

                            <VolunteerInfoCard
                                volunteer={volunteerInfo ?? queue.job?.vlt}
                                jobStatus={jobStatus}
                                hasLocation={isLive || jobStatus === 'COMPLETED'}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
