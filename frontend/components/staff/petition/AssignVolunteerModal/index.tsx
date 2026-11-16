'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import Swal from '@/lib/swal';
import { Car, Users, Calendar, MapPin, Search, X } from 'lucide-react';
import type { LatLng, BusyResources } from '@/types/common';

import { Queue, Volunteer, Vehicle } from './types';
import VehicleSelectorModal from './VehicleSelectorModal';
import VolunteerSelectorModal from './VolunteerSelectorModal';
import CareuSelectorModal from './CareuSelectorModal';
import {
    hasSpecialSeatRequirement,
} from '@/utils/vehicleSeatCapacity';

interface AssignVolunteerModalProps {
    isOpen: boolean;
    onClose: () => void;
    queueId: number;
    onAssign: () => void;
    isReassign?: boolean;
    existingJobId?: number;
}

export default function AssignVolunteerModal({ isOpen, onClose, queueId, onAssign, isReassign, existingJobId }: AssignVolunteerModalProps) {
    const [targetQueue, setTargetQueue] = useState<Queue | null>(null);
    const [suggestedQueues, setSuggestedQueues] = useState<Queue[]>([]);
    const [selectedQueues, setSelectedQueues] = useState<number[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [selectedVolunteer, setSelectedVolunteer] = useState<string | null>(null);

    const [careUs, setCareUs] = useState<Volunteer[]>([]);
    const [careuByQueueId, setCareuByQueueId] = useState<Record<number, string>>({});
    const [careuPickerQueueId, setCareuPickerQueueId] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [patientLocation, setPatientLocation] = useState<LatLng | null>(null);
    const [activeModal, setActiveModal] = useState<'vehicle' | 'driver' | null>(null);
    const [busyResources, setBusyResources] = useState<BusyResources>({ busyVehicleIds: [], busyDriverIds: [], busyCareuIds: [] });

    useBodyScrollLock(isOpen);

    const hasSpecialRequirements = (queue: Queue) =>
        hasSpecialSeatRequirement(queue.user.mobilityStatus, queue.requiredEquipment);

    const mobilityStatusText = (status: string | null) => {
        switch (status) {
            case 'WALKING': return 'เดินได้';
            case 'WHEELCHAIR': return 'รถเข็น';
            case 'BEDRIDDEN': return 'ติดเตียง';
            default: return status || 'ไม่ระบุ';
        }
    };

    const combinedSelectedQueues = [
        ...(targetQueue ? [targetQueue] : []),
        ...suggestedQueues.filter(q => selectedQueues.includes(q.id))
    ];

    const needsSpecialVehicle = combinedSelectedQueues.some(hasSpecialRequirements);
    const needsCareU = combinedSelectedQueues.some(q => q.wantCareU);
    const careuRequestQueues = combinedSelectedQueues.filter((q) => q.wantCareU);
    const careuCount = careuRequestQueues.length;
    const patientCount = combinedSelectedQueues.length;
    const totalCapacityNeeded = patientCount + careuCount;

    const seatBreakdown = [
        ...combinedSelectedQueues.map((q) => {
            const name = q.user.displayName || `${q.user.firstName} ${q.user.lastName}`.trim();
            return {
                id: `patient-${q.id}`,
                name: `ผู้ป่วย: ${name}`,
                isCareU: false,
            };
        }),
        ...careuRequestQueues.map((q) => {
            const patientName = q.user.displayName || `${q.user.firstName} ${q.user.lastName}`.trim();
            const careuVolunteer = careUs.find((c) => c.id === careuByQueueId[q.id]);
            const careuName = careuVolunteer
                ? (careuVolunteer.displayName || `${careuVolunteer.firstName} ${careuVolunteer.lastName}`.trim())
                : `จิตอาสาแคร์ยู (ดูแล ${patientName})`;
            return {
                id: `careu-${q.id}`,
                name: `🟣 แคร์ยู: ${careuName}`,
                isCareU: true,
            };
        }),
    ];

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    };

    useEffect(() => {
        if (isOpen && queueId) {
            setSelectedQueues([]);
            setSelectedVehicle(null);
            setSelectedVolunteer(null);
            setCareuByQueueId({});
            setCareuPickerQueueId(null);
            fetchData();
        }
    }, [isOpen, queueId]);

    useEffect(() => {
        if (selectedVehicle) {
            const currentVeh = vehicles.find(v => v.id === selectedVehicle);
            if (currentVeh && (currentVeh.capacity || 0) < totalCapacityNeeded) {
                setSelectedVehicle(null);
            }
        }
    }, [totalCapacityNeeded, selectedVehicle, vehicles]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const queueRes = await fetchWithAuth(`/queues/${queueId}`);
            if (!queueRes.ok) throw new Error('Failed to fetch queue');
            const targetQ: Queue = await queueRes.json();
            setTargetQueue(targetQ);

            if (targetQ.user?.lat && targetQ.user?.lng) {
                setPatientLocation({ lat: targetQ.user.lat, lng: targetQ.user.lng });
            }

            const allQueuesRes = await fetchWithAuth(`/queues?status=CONFIRMED&limit=100`);
            const allQueuesJson = await allQueuesRes.json();
            const allQueues: Queue[] = Array.isArray(allQueuesJson) ? allQueuesJson : (allQueuesJson.data || []);

            const targetDateStr = new Date(targetQ.requestDate).toISOString().split('T')[0];

            if (targetQ.job) {
                if (targetQ.job.vehicleId) {
                    setSelectedVehicle(targetQ.job.vehicleId);
                }
                if (targetQ.job.vltId) {
                    setSelectedVolunteer(targetQ.job.vltId);
                }
                if (targetQ.job.careuId) {
                    setCareuByQueueId((prev) => ({ ...prev, [targetQ.id]: targetQ.job!.careuId! }));
                }
            }

            const normTime = (timeStr?: string | null) => {
                if (!timeStr) return '';
                return timeStr.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
            };

            const targetTime = normTime(targetQ.bookingTime);

            const suggestions = allQueues.filter(q => {
                const qDateStr = new Date(q.requestDate).toISOString().split('T')[0];
                const qTime = normTime(q.bookingTime);
                const isSameTime = targetTime !== '' && qTime === targetTime;

                return q.id !== targetQ.id &&
                    q.user.id !== targetQ.user.id &&
                    q.hospital?.id === targetQ.hospital?.id &&
                    qDateStr === targetDateStr &&
                    isSameTime &&
                    !!q.job?.id &&
                    ['OPEN', 'ASSIGNED', 'ACCEPTED'].includes(q.job.status);
            });
            setSuggestedQueues(suggestions);

            const matchedQueues = suggestions.filter(q => q.job?.id === targetQ.job?.id);
            if (matchedQueues.length > 0) {
                setSelectedQueues(matchedQueues.map(q => q.id));
                setCareuByQueueId((prev) => {
                    const next = { ...prev };
                    matchedQueues.forEach(q => {
                        if (q.job?.careuId) {
                            next[q.id] = q.job.careuId;
                        }
                    });
                    return next;
                });
            }

            const vehiclesRes = await fetchWithAuth(`/vehicles?limit=100`);
            const vehiclesJson = await vehiclesRes.json();
            setVehicles(Array.isArray(vehiclesJson) ? vehiclesJson : (vehiclesJson.data || []));

            const volRes = await fetchWithAuth('/users/volunteers?limit=999');
            const volJson = await volRes.json();
            const volunteersData: Volunteer[] = Array.isArray(volJson) ? volJson : (volJson.data || []);

            const processedVolunteers = volunteersData.map(vol => {
                if (targetQ.user?.lat && targetQ.user?.lng && vol.latitude && vol.longitude) {
                    const dist = calculateDistance(targetQ.user.lat, targetQ.user.lng, vol.latitude, vol.longitude);
                    return { ...vol, distance: dist };
                }
                return { ...vol, distance: Infinity };
            });

            processedVolunteers.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
            setVolunteers(processedVolunteers);

            const careuRes = await fetchWithAuth('/users/careu?limit=999');
            if (careuRes.ok) {
                const careuJson = await careuRes.json();
                const careuData: Volunteer[] = Array.isArray(careuJson) ? careuJson : (careuJson.data || []);
                const processedCareUs = careuData.map(vol => {
                    if (targetQ.user?.lat && targetQ.user?.lng && vol.latitude && vol.longitude) {
                        const dist = calculateDistance(targetQ.user.lat, targetQ.user.lng, vol.latitude, vol.longitude);
                        return { ...vol, distance: dist };
                    }
                    return { ...vol, distance: Infinity };
                });
                processedCareUs.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
                setCareUs(processedCareUs);
            }

            if (targetQ.bookingTime) {
                try {
                    const dateStr = new Date(targetQ.requestDate).toISOString().split('T')[0];
                    const hospParam = targetQ.hospital?.id ? `&hospitalId=${targetQ.hospital.id}` : '';
                    const exclParam = (isReassign && existingJobId) ? `&excludeJobId=${existingJobId}` : targetQ.job?.id ? `&excludeJobId=${targetQ.job.id}` : '';
                    const busyRes = await fetchWithAuth(
                        `/jobs/resource-availability?date=${dateStr}&bookingTime=${encodeURIComponent(targetQ.bookingTime)}${hospParam}${exclParam}`
                    );
                    if (busyRes.ok) {
                        const busyData = await busyRes.json();
                        setBusyResources(busyData);
                    }
                } catch (e) {
                    console.warn('Failed to fetch resource availability', e);
                }
            }

        } catch (error) {
            console.error(error);
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถโหลดข้อมูลได้' });
        } finally {
            setLoading(false);
        }
    };

    const toggleSuggestedQueue = (id: number) => {
        setSelectedQueues((prev) => {
            const next = prev.includes(id) ? prev.filter((qid) => qid !== id) : [...prev, id];
            if (prev.includes(id)) {
                setCareuByQueueId((careuMap) => {
                    const updated = { ...careuMap };
                    delete updated[id];
                    return updated;
                });
            }
            return next;
        });
    };

    const getQueueDisplayName = (q: Queue) =>
        q.user.displayName || `${q.user.firstName} ${q.user.lastName}`.trim();

    const setCareUForQueue = (queueId: number, careuId: string | null) => {
        setCareuByQueueId((prev) => {
            const next = { ...prev };
            if (careuId) next[queueId] = careuId;
            else delete next[queueId];
            return next;
        });
        setCareuPickerQueueId(null);
    };

    const handleAssign = async () => {
        if (!selectedVolunteer || !selectedVehicle) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาเลือกรถและคนขับ' });
            return;
        }

        const selectedVehicleObj = vehicles.find(v => v.id === selectedVehicle);
        if (!selectedVehicleObj) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาเลือกรถที่จะใช้งาน' });
            return;
        }

        if ((selectedVehicleObj.capacity || 0) < totalCapacityNeeded) {
            Swal.fire({
                icon: 'warning',
                title: 'ที่นั่งไม่เพียงพอ',
                text: `รถทะเบียน ${selectedVehicleObj.licensePlate} มีความจุ ${selectedVehicleObj.capacity} ที่นั่ง แต่มีผู้โดยสารทั้งหมด ${totalCapacityNeeded} ที่นั่ง กรุณาเลือกรถที่มีความจุตั้งแต่ ${totalCapacityNeeded} ที่นั่งขึ้นไป`,
            });
            return;
        }

        const queuesToAssign = combinedSelectedQueues;

        const careuMissing = queuesToAssign.filter((q) => q.wantCareU && !careuByQueueId[q.id]);
        if (careuMissing.length > 0) {
            const names = careuMissing.map(getQueueDisplayName).join(', ');
            Swal.fire({
                icon: 'warning',
                title: 'เลือกแคร์ยูไม่ครบ',
                text: `กรุณาเลือกจิตอาสาแคร์ยูให้ผู้ป่วยที่ร้องขอ: ${names}`,
            });
            return;
        }

        const invalidQueues = queuesToAssign.filter(q => !q.job?.id);
        if (invalidQueues.length > 0) {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'พบคิวที่ยังไม่มี Job ID ในระบบ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลประชาชน' });
            return;
        }

        setIsAssigning(true);
        try {
            const results: Response[] = [];
            for (const q of queuesToAssign) {
                const jobId = q.job!.id;
                let res: Response;
                const needsReassign = q.job!.status === 'ASSIGNED' || q.job!.status === 'ACCEPTED' || (isReassign && jobId === existingJobId);
                const careuId = q.wantCareU ? careuByQueueId[q.id] : undefined;
                if (needsReassign) {
                    res = await fetchWithAuth(`/jobs/${jobId}/reassign`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            vltId: selectedVolunteer,
                            vehicleId: selectedVehicle,
                            careuId: careuId || undefined,
                        })
                    });
                } else {
                    res = await fetchWithAuth(`/jobs/${jobId}/assign`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            vltId: selectedVolunteer,
                            vehicleId: selectedVehicle,
                            careuId: careuId || undefined,
                            assignedBy: 'system',
                        })
                    });
                }
                results.push(res);
            }
            const failed = results.filter(r => !r.ok);

            if (failed.length > 0) {
                let errorMsg = 'คำร้องส่วนน้อยล้มเหลว';
                try {
                    const errorJson = await failed[0].json();
                    if (errorJson.message) errorMsg = errorJson.message;
                } catch (e) { }
                throw new Error(errorMsg);
            }

            Swal.fire({
                icon: 'success',
                title: isReassign ? 'แก้ไขการมอบหมายสำเร็จ' : 'มอบหมายงานเสร็จสิ้น',
                text: isReassign ? 'เปลี่ยนรถ/คนขับ/บัดดี้เรียบร้อย' : `รวม ${queuesToAssign.length} งาน`,
                timer: 1500,
                showConfirmButton: false,
            });

            onAssign();
            onClose();
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message || 'ไม่สามารถมอบหมายงานได้' });
        } finally {
            setIsAssigning(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100]" />
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden pointer-events-auto">

                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Car className="w-5 h-5 text-brand-primary" />
                            {isReassign ? 'แก้ไขการมอบหมาย' : 'จัดรถและมอบหมายคนขับ'}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลและคำนวณเส้นทาง...</p>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-3xl mx-auto pb-4">

                                <div className="bg-slate-800 rounded-xl p-4 text-white shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1">สรุปการจัดรถ</p>
                                            <p className="font-semibold">
                                                {combinedSelectedQueues.length} ผู้ป่วยที่เรียกใช้บริการ
                                                {careuCount > 0 && (
                                                    <span className="text-purple-300 font-medium ml-1.5">
                                                        + {careuCount} จิตอาสาแคร์ยู
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-gray-400 text-xs mt-1">
                                                {careuCount > 0
                                                    ? 'รวมที่นั่งผู้ป่วยและจิตอาสาแคร์ยู (ไม่รวมเบาะคนขับ)'
                                                    : 'รวมคิวหลัก + รายการที่ติ๊กใน「นั่งไปด้วยกันได้」'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-gray-300 text-xs font-medium uppercase tracking-wider mb-1">พื้นที่ขั้นต่ำที่ต้องการ</p>
                                            <p className="font-bold text-lg text-green-400">{totalCapacityNeeded} ที่นั่ง</p>
                                        </div>
                                    </div>
                                    {seatBreakdown.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-600 space-y-1.5">
                                            <p className="text-gray-400 text-xs">นับ 1 คน = 1 ที่นั่งผู้โดยสาร</p>
                                            {seatBreakdown.map((item) => (
                                                <p key={item.id} className="text-sm text-gray-200 flex justify-between gap-2">
                                                    <span className={`truncate ${item.isCareU ? 'text-purple-300 font-medium' : ''}`}>{item.name}</span>
                                                    <span className={`shrink-0 font-medium ${item.isCareU ? 'text-purple-300' : 'text-green-300'}`}>1 ที่นั่ง</span>
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                    { }
                                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">คิวหลักที่เลือก</h3>
                                        {targetQueue && (
                                            <div className="flex gap-4">
                                                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                                                    {targetQueue.user.pictureUrl ? (
                                                        <>
                                                            <img
                                                                src={targetQueue.user.pictureUrl}
                                                                className="w-14 h-14 rounded-full object-cover"
                                                                alt=""
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    if (e.currentTarget.nextElementSibling) {
                                                                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                                                                    }
                                                                }}
                                                            />
                                                            <Users className="w-6 h-6 text-brand-primary" style={{ display: 'none' }} />
                                                        </>
                                                    ) : (
                                                        <Users className="w-6 h-6 text-brand-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 text-lg">
                                                        {targetQueue.user.displayName || `${targetQueue.user.firstName} ${targetQueue.user.lastName}`}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                                                        <MapPin className="w-4 h-4" />
                                                        ไปยัง {targetQueue.hospital?.name || 'ไม่ระบุ'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(targetQueue.requestDate).toLocaleDateString('th-TH')} {targetQueue.bookingTime || 'N/A'} น.
                                                    </div>
                                                    {(targetQueue.requiredEquipment || hasSpecialRequirements(targetQueue)) && (
                                                        <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 mr-2">
                                                            ต้องการ {targetQueue.requiredEquipment || mobilityStatusText(targetQueue.user.mobilityStatus)}
                                                        </span>
                                                    )}
                                                    {targetQueue.wantCareU && (
                                                        <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                            ร้องขอจิตอาสาแคร์ยู
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    { }
                                    {!isReassign && suggestedQueues.length > 0 && (
                                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                            <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-2">
                                                นั่งไปด้วยกันได้
                                            </h3>
                                            <p className="text-xs text-blue-600/80 mb-4">
                                                ระบบพบรายการที่ต้องไปโรงพยาบาลเดียวกันและวันเดียวกัน
                                                เลือกเพื่อรวบงานจัดรถคันเดียว
                                            </p>

                                            <div className="space-y-3">
                                                {suggestedQueues.map(q => {
                                                    const isSelected = selectedQueues.includes(q.id);
                                                    return (
                                                        <div
                                                            key={q.id}
                                                            onClick={() => toggleSuggestedQueue(q.id)}
                                                            className={`p-3 border rounded-lg cursor-pointer transition-all flex items-start gap-3 ${isSelected ? 'border-brand-primary bg-green-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                                                        >
                                                            <div className={`mt-1 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${isSelected ? 'bg-brand-primary border-brand-primary' : 'border-gray-300'}`}>
                                                                {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                            </div>
                                                            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                                                                {q.user.pictureUrl ? (
                                                                    <img
                                                                        src={q.user.pictureUrl}
                                                                        className="w-10 h-10 rounded-full object-cover"
                                                                        alt=""
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                            if (e.currentTarget.nextElementSibling) {
                                                                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                                                                            }
                                                                        }}
                                                                    />
                                                                ) : null}
                                                                <Users className="w-4 h-4 text-brand-primary" style={{ display: q.user.pictureUrl ? 'none' : 'block' }} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-1 mb-1">
                                                                    {q.user.displayName || `${q.user.firstName} ${q.user.lastName}`}
                                                                </p>
                                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3" />
                                                                    ไปยัง {q.hospital?.name || 'ไม่ระบุ'}
                                                                </p>
                                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(q.requestDate).toLocaleDateString('th-TH')} {q.bookingTime || 'ไม่ระบุ'} น.
                                                                </p>
                                                                {q.job?.vlt && (
                                                                    <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5 font-medium">
                                                                        <Car className="w-3 h-3" />
                                                                        มีรถรับส่งแล้ว ({q.job.vlt.firstName})
                                                                    </p>
                                                                )}
                                                                {(q.requiredEquipment || hasSpecialRequirements(q)) && (
                                                                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800 border border-red-200 mr-1">
                                                                        ต้องการ {q.requiredEquipment || mobilityStatusText(q.user.mobilityStatus)}
                                                                    </span>
                                                                )}
                                                                {q.wantCareU && (
                                                                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                                        ขอร้องจิตอาสาแคร์ยู
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    { }
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800 mb-3 flex justify-between items-end">
                                            <span>1. เลือกรถที่จะใช้งาน</span>
                                            <span className="text-xs font-normal text-slate-500">ต้องการขั้นต่ำ {totalCapacityNeeded} ที่นั่ง</span>
                                        </h3>
                                        <div
                                            onClick={() => setActiveModal('vehicle')}
                                            className={`w-full p-4 border rounded-xl cursor-pointer flex justify-between items-center transition-all bg-white shadow-sm ${selectedVehicle
                                                ? 'border-brand-primary bg-green-50 ring-1 ring-brand-primary'
                                                : 'border-gray-200 hover:border-brand-primary hover:bg-gray-50'
                                                }`}
                                        >
                                            {selectedVehicle && vehicles.find(v => v.id === selectedVehicle) ? (
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 border-b-2 border-slate-900 self-start mb-1">{vehicles.find(v => v.id === selectedVehicle)?.licensePlate}</span>
                                                    <span className="text-xs font-semibold text-gray-700">{vehicles.find(v => v.id === selectedVehicle)?.name || '-'}</span>
                                                    <span className="text-xs text-gray-500 mt-1">ความจุ {vehicles.find(v => v.id === selectedVehicle)?.capacity} ที่นั่ง</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 font-medium py-2">แตะเพื่อเลือกยานพาหนะ (ต้องการ {totalCapacityNeeded} ที่นั่ง)...</span>
                                            )}
                                            <div className="flex items-center gap-3">
                                                {selectedVehicle && (
                                                    <span className="text-[10px] font-bold text-brand-primary bg-green-100 px-2 py-1 rounded">
                                                        เลือกแล้ว
                                                    </span>
                                                )}
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <Search className="w-4 h-4 text-gray-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    { }
                                    <div className="pt-4 border-t border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center justify-between">
                                            <span>2. เลือกเจ้าหน้าที่ขับรถ</span>
                                        </h3>
                                        <div
                                            onClick={() => setActiveModal('driver')}
                                            className={`w-full p-4 border rounded-xl cursor-pointer flex justify-between items-center transition-all bg-white shadow-sm ${selectedVolunteer
                                                ? 'border-brand-primary bg-green-50 ring-1 ring-brand-primary'
                                                : 'border-gray-200 hover:border-brand-primary hover:bg-gray-50'
                                                }`}
                                        >
                                            {selectedVolunteer && volunteers.find(v => v.id === selectedVolunteer) ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                        {volunteers.find(v => v.id === selectedVolunteer)?.pictureUrl ? (
                                                            <img
                                                                src={volunteers.find(v => v.id === selectedVolunteer)?.pictureUrl!}
                                                                className="w-full h-full object-cover"
                                                                alt=""
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    if (e.currentTarget.nextElementSibling) {
                                                                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                                                    }
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100" style={{ display: volunteers.find(v => v.id === selectedVolunteer)?.pictureUrl ? 'none' : 'flex' }}>
                                                            <Users className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{volunteers.find(v => v.id === selectedVolunteer)?.displayName || volunteers.find(v => v.id === selectedVolunteer)?.firstName}</span>
                                                        <span className="text-xs text-gray-500">{volunteers.find(v => v.id === selectedVolunteer)?.phone || 'ไม่มีเบอร์โทร'}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 font-medium py-2">แตะเพื่อเลือกเจ้าหน้าที่รถ...</span>
                                            )}
                                            <div className="flex items-center gap-3">
                                                {selectedVolunteer && (
                                                    <span className="text-[10px] font-bold text-brand-primary bg-green-100 px-2 py-1 rounded">
                                                        เลือกแล้ว
                                                    </span>
                                                )}
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <Search className="w-4 h-4 text-gray-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    { }
                                    {careUs.length > 0 && needsCareU && (
                                        <div className="mt-6 pt-4 border-t border-gray-100">
                                            <h3 className="text-sm font-bold text-gray-800 mb-1">
                                                3. เลือกจิตอาสาแคร์ยู
                                            </h3>
                                            <p className="text-xs text-gray-500 mb-3">
                                                เลือกแคร์ยูให้แต่ละผู้ป่วยที่ร้องขอ ({careuRequestQueues.length} คน) — เลือกคนเดียวกันซ้ำได้
                                            </p>
                                            <div className="space-y-3">
                                                {careuRequestQueues.map((q) => {
                                                    const selectedId = careuByQueueId[q.id] ?? null;
                                                    const selectedCareU = selectedId
                                                        ? careUs.find((v) => v.id === selectedId)
                                                        : null;
                                                    return (
                                                        <div
                                                            key={q.id}
                                                            onClick={() => setCareuPickerQueueId(q.id)}
                                                            className={`w-full p-4 border rounded-xl cursor-pointer flex justify-between items-center transition-all bg-white shadow-sm ${selectedId
                                                                ? 'border-brand-primary bg-purple-50 ring-1 ring-brand-primary'
                                                                : 'border-gray-200 hover:border-brand-primary hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-xs font-semibold text-purple-700 mb-1">
                                                                    แคร์ยูสำหรับ {getQueueDisplayName(q)}
                                                                </span>
                                                                {selectedCareU ? (
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                                            {selectedCareU.pictureUrl ? (
                                                                                <img
                                                                                    src={selectedCareU.pictureUrl}
                                                                                    className="w-full h-full object-cover"
                                                                                    alt=""
                                                                                />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                                                    <Users className="w-4 h-4 text-gray-400" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-bold text-gray-900 text-sm block">
                                                                                {selectedCareU.displayName || selectedCareU.firstName}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">{selectedCareU.phone || 'ไม่มีเบอร์โทร'}</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-500 font-medium text-sm">แตะเพื่อเลือกแคร์ยู...</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {selectedId && (
                                                                    <>
                                                                        <span className="text-[10px] font-bold text-brand-primary bg-purple-100 px-2 py-1 rounded">
                                                                            เลือกแล้ว
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setCareUForQueue(q.id, null);
                                                                            }}
                                                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                                            title="ยกเลิก"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {!selectedId && (
                                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                                        <Search className="w-4 h-4 text-gray-500" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                </div>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            * เมื่อเริ่มมอบหมายงาน ผู้ป่วยจะได้สถานะ "คนขับกำลังไปรับ" พร้อมกันทั้งหมดในกลุ่มที่เลือก
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isAssigning}
                                className="px-6 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={isAssigning}
                                className="px-8 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-btn-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isAssigning ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        กำลังมอบหมาย...
                                    </>
                                ) : (
                                    isReassign ? 'ยืนยัน' : 'ยืนยัน'
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {activeModal === 'vehicle' && (
                <VehicleSelectorModal
                    vehicles={vehicles}
                    selectedVehicle={selectedVehicle}
                    onSelectVehicle={(id) => { setSelectedVehicle(id); setActiveModal(null); }}
                    onClose={() => setActiveModal(null)}
                    needsSpecialVehicle={needsSpecialVehicle}
                    totalCapacityNeeded={totalCapacityNeeded}
                    busyVehicleIds={busyResources.busyVehicleIds}
                />
            )}

            {activeModal === 'driver' && (
                <VolunteerSelectorModal
                    volunteers={volunteers}
                    selectedVolunteer={selectedVolunteer}
                    onSelectVolunteer={(id) => { setSelectedVolunteer(id); setActiveModal(null); }}
                    onClose={() => setActiveModal(null)}
                    busyDriverIds={busyResources.busyDriverIds}
                />
            )}

            {careuPickerQueueId !== null && (
                <CareuSelectorModal
                    careUs={careUs}
                    selectedCareU={careuByQueueId[careuPickerQueueId] ?? null}
                    onSelectCareU={(id) => setCareUForQueue(careuPickerQueueId, id)}
                    onClose={() => setCareuPickerQueueId(null)}
                    busyCareuIds={busyResources.busyCareuIds}
                    patientLabel={(() => {
                        const q = combinedSelectedQueues.find((item) => item.id === careuPickerQueueId);
                        return q ? getQueueDisplayName(q) : undefined;
                    })()}
                />
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #CBD5E1;
                    border-radius: 20px;
                }
            `}</style>
        </>
    );
}
