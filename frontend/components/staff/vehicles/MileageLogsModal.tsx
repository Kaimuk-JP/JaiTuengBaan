'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/api-client';
import { Vehicle } from './VehiclesClient';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface MileageLogsModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicle: Vehicle | null;
}

interface MileageLog {
    id: number;
    jobId: number;
    mileageBefore: number;
    mileageAfter: number;
    createdAt: string;
    job: {
        id: number;
        queue: {
            id: number;
            hospital: { name: string } | null;
            user: { firstName: string, lastName: string };
        };
        vlt: { firstName: string, lastName: string } | null;
    };
}

export default function MileageLogsModal({ isOpen, onClose, vehicle }: MileageLogsModalProps) {
    const [logs, setLogs] = useState<MileageLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useBodyScrollLock(isOpen);

    useEffect(() => {
        if (isOpen && vehicle) {
            fetchLogs();
        } else {
            setLogs([]);
        }
    }, [isOpen, vehicle]);

    const fetchLogs = async () => {
        if (!vehicle) return;
        try {
            setIsLoading(true);
            const response = await axios.get(`/vehicles/${vehicle.id}/mileage?limit=50`);
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching mileage logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !vehicle) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ประวัติการวิ่งรถ: {vehicle.name}
                        </h2>
                        <div className="text-sm text-gray-500 mt-1 flex gap-4">
                            <span>ทะเบียน: <span className="font-semibold text-gray-700">{vehicle.licensePlate}</span></span>
                            <span>เลขไมล์ล่าสุด: <span className="font-semibold text-brand-primary">{vehicle.totalMileageKm.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} กม.</span></span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors shrink-0 outline-none focus:ring-2 focus:ring-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="p-0 overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-gray-50 shadow-sm z-10">
                            <tr className="text-gray-500 text-sm border-b border-gray-200">
                                <th className="p-4 font-semibold whitespace-nowrap">วันที่เวลา (งานเสร็จ)</th>
                                <th className="p-4 font-semibold">งาน/ผู้ป่วย</th>
                                <th className="p-4 font-semibold">จิตอาสาผู้ขับ</th>
                                <th className="p-4 font-semibold text-right">ไมล์เริ่มต้น</th>
                                <th className="p-4 font-semibold text-right">ไมล์สิ้นสุด</th>
                                <th className="p-4 font-semibold text-right">ระยะทาง (กม.)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                                            กำลังโหลดประวัติการใช้งาน...
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">ไม่พบประวัติการวิ่ง</h3>
                                        <p className="mt-1 text-gray-500">รถคันนี้ยังไม่เคยถูกใช้งานในระบบ</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatDate(log.createdAt)}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 border border-gray-200 rounded px-2 py-0.5 inline-flex items-center text-xs mb-1">
                                                Job #{log.jobId}
                                            </div>
                                            <div className="text-sm font-medium text-brand-primary">
                                                {log.job.queue.user.firstName} {log.job.queue.user.lastName}
                                            </div>
                                            {log.job.queue.hospital && (
                                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                                    {log.job.queue.hospital.name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-medium text-gray-700">
                                                {log.job.vlt ? `${log.job.vlt.firstName} ${log.job.vlt.lastName}` : 'ไม่ระบุ'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right text-gray-500 font-mono text-sm">
                                            {log.mileageBefore.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                        </td>
                                        <td className="p-4 text-right text-gray-700 font-mono font-medium text-sm">
                                            {log.mileageAfter.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="inline-flex items-center px-2.5 py-1 rounded bg-green-50 text-green-700 font-bold border border-green-100 text-sm font-mono">
                                                +{(log.mileageAfter - log.mileageBefore).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
