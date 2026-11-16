'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import Swal from '@/lib/swal';
import PatientProfileSection from './PatientProfileSection';
import PatientInfoForm from './PatientInfoForm';
import AppointmentImageSection from './AppointmentImageSection';
import EquipmentCheckboxes from './EquipmentCheckboxes';
import ModalActions from './ModalActions';

interface Hospital {
    id: number;
    name: string;
}

interface Queue {
    id: number;
    userId: number;
    user: {
        id: number;
        displayName: string;
        firstName?: string;
        lastName?: string;
        phone: string;
        mobilityStatus: string;
        address?: string;
        addressDetail?: string;
        pictureUrl?: string;
        idCard?: string;
    };
    hospitalId?: number;
    hospital?: { id: number; name: string };
    hospitalName?: string;
    requestDate: string;
    bookingTime?: string;
    appointmentImage?: string;
    requiredEquipment?: string;
    hasAppointment: boolean;
    wantCareU?: boolean;
    status: string;
    severityLevel: string;
    adminNote?: string;
    rejectReason?: string;
    createdAt: string;
}

interface PatientDetailModalProps {
    queue: Queue | null;
    isOpen: boolean;
    onClose: () => void;
    onApprove: (queueId: number) => void;
    onReject: (queueId: number) => void;
    onResubmitToExecutive?: (queueId: number) => void;
    userRole?: string;
    executiveApprovalEnabled?: boolean;
}

export default function PatientDetailModal({ queue, isOpen, onClose, onApprove, onReject, onResubmitToExecutive, userRole, executiveApprovalEnabled = true }: PatientDetailModalProps) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedData, setEditedData] = useState<any>({});
    const [hospitals, setHospitals] = useState<Hospital[]>([]);

    useBodyScrollLock(isOpen);

    const isJsonChangeLog = (note?: string) => {
        if (!note || typeof note !== 'string' || !note.trim().startsWith('{')) return false;
        try {
            const parsed = JSON.parse(note);
            return !!(parsed && typeof parsed === 'object' && (parsed.hospitalName || parsed.bookingTime || parsed.requestDate));
        } catch {
            return false;
        }
    };

    const getInitialNote = (note?: string) => {
        if (isJsonChangeLog(note)) return '';
        return note || '';
    };

    useEffect(() => {
        if (queue) {
            let normalizedDate = queue.requestDate || '';
            if (normalizedDate && normalizedDate.length > 10) {
                normalizedDate = normalizedDate.substring(0, 10);
            }

            setEditedData({
                hospitalId: queue.hospitalId || queue.hospital?.id || null,
                hospitalName: queue.hospital?.name || queue.hospitalName || '',
                requestDate: normalizedDate,
                bookingTime: queue.bookingTime || '',
                hasAppointment: queue.hasAppointment,
                requiredEquipment: queue.requiredEquipment || '',
                adminNote: getInitialNote(queue.adminNote),
            });
        }
    }, [queue]);

    useEffect(() => {
        if (isEditMode && hospitals.length === 0) {
            fetchWithAuth('/hospitals')
                .then(res => res.json())
                .then(data => {
                    const list = Array.isArray(data) ? data : data.data || [];
                    setHospitals(list);
                })
                .catch(err => console.error('Failed to fetch hospitals:', err));
        }
    }, [isEditMode]);

    if (!isOpen || !queue) return null;

    const handleApprove = () => {
        const missingFields: string[] = [];
        if (!queue.hospitalId && !queue.hospital?.id) missingFields.push('โรงพยาบาล');
        if (!queue.bookingTime) missingFields.push('เวลาจอง');
        if (!queue.requestDate) missingFields.push('วันที่ขอใช้บริการ');

        if (missingFields.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบถ้วน',
                html: `กรุณาแก้ไขข้อมูลให้ครบก่อนรับคำร้อง:<br/><br/><ul style="text-align: left; list-style: disc; padding-left: 20px; font-size: 15px;">${missingFields.map(f => `<li>${f}</li>`).join('')}</ul>`,
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        onApprove(queue.id);
        onClose();
    };

    const handleReject = () => {
        onReject(queue.id);
        onClose();
    };

    const handleResubmitToExecutive = () => {
        const missingFields: string[] = [];
        if (!queue.hospitalId && !queue.hospital?.id) missingFields.push('โรงพยาบาล');
        if (!queue.bookingTime) missingFields.push('เวลาจอง');
        if (!queue.requestDate) missingFields.push('วันที่ขอใช้บริการ');

        if (missingFields.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบถ้วน',
                html: `กรุณาแก้ไขข้อมูลให้ครบก่อนส่งกลับผู้บริหาร:<br/><br/><ul style="text-align: left; list-style: disc; padding-left: 20px; font-size: 15px;">${missingFields.map(f => `<li>${f}</li>`).join('')}</ul>`,
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        onResubmitToExecutive?.(queue.id);
        onClose();
    };

    const handleSave = async () => {
        const missingFields: string[] = [];
        if (!editedData.hospitalId) missingFields.push('โรงพยาบาล');
        if (!editedData.requestDate) missingFields.push('วันที่ขอใช้บริการ');
        if (!editedData.bookingTime) missingFields.push('เวลานัด');

        if (missingFields.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณากรอกข้อมูลให้ครบ',
                html: `ข้อมูลต่อไปนี้ยังไม่ได้กรอกหรือเลือก:<br/><br/><ul style="text-align: left; list-style: disc; padding-left: 20px; font-size: 15px;">${missingFields.map(f => `<li>${f}</li>`).join('')}</ul>`,
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        try {
            const payload: any = {
                requestDate: editedData.requestDate,
                bookingTime: editedData.bookingTime,
                requiredEquipment: editedData.requiredEquipment,
                adminNote: editedData.adminNote,
            };
            if (editedData.hospitalId) {
                payload.hospitalId = Number(editedData.hospitalId);
            }

            const response = await fetchWithAuth(`/queues/${queue.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setIsEditMode(false);
                onClose();
            } else {
                const errData = await response.json().catch(() => ({}));
                console.error('Failed to update queue:', errData);
                alert('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
            }
        } catch (error) {
            console.error('Error saving data:', error);
            alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        }
    };

    const handleCancel = () => {
        let normalizedDate = queue.requestDate || '';
        if (normalizedDate && normalizedDate.length > 10) {
            normalizedDate = normalizedDate.substring(0, 10);
        }

        setEditedData({
            hospitalId: queue.hospitalId || queue.hospital?.id || null,
            hospitalName: queue.hospital?.name || queue.hospitalName || '',
            requestDate: normalizedDate,
            bookingTime: queue.bookingTime || '',
            hasAppointment: queue.hasAppointment,
            requiredEquipment: queue.requiredEquipment || '',
            adminNote: getInitialNote(queue.adminNote),
        });
        setIsEditMode(false);
    };

    const handleDataChange = (field: string, value: any) => {
        setEditedData((prev: any) => ({ ...prev, [field]: value }));
    };

    const toggleEquipment = (equipment: string) => {
        if (!isEditMode) return;

        const currentEquipment = editedData.requiredEquipment || '';
        const equipmentList = currentEquipment.split(',').map((e: string) => e.trim()).filter(Boolean);

        if (equipmentList.includes(equipment)) {
            setEditedData({
                ...editedData,
                requiredEquipment: equipmentList.filter((e: string) => e !== equipment).join(',')
            });
        } else {
            setEditedData({
                ...editedData,
                requiredEquipment: [...equipmentList, equipment].join(',')
            });
        }
    };

    return (
        <>
            { }
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            { }
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    { }
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                        <h2 className="text-xl font-semibold text-gray-900">รายละเอียดประชาชน</h2>
                        <div className="flex items-center gap-2">
                            {!isEditMode && userRole !== 'EXECUTIVE' && (
                                <button
                                    onClick={() => setIsEditMode(true)}
                                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    แก้ไข
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    { }
                    <div className="p-6">
                        {queue.status === 'EXECUTIVE_REJECTED' && queue.rejectReason && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                                <h4 className="text-sm font-semibold text-red-700 mb-1">เหตุผลที่ผู้บริหารส่งกลับ</h4>
                                <p className="text-sm text-red-800 whitespace-pre-wrap">{queue.rejectReason}</p>
                                <p className="text-xs text-red-600 mt-2">กรุณาแก้ไขข้อมูลให้ประชาชน แล้วกดส่งกลับผู้บริหารอนุมัติอีกครั้ง</p>
                            </div>
                        )}

                        <PatientProfileSection
                            pictureUrl={queue.user?.pictureUrl}
                            displayName={`${queue.user?.firstName || ''} ${queue.user?.lastName || ''}`.trim() || 'ไม่ระบุชื่อ'}
                        />

                        <PatientInfoForm
                            displayName={`${queue.user?.firstName || ''} ${queue.user?.lastName || ''}`.trim() || 'ไม่ระบุชื่อ'}
                            mobilityStatus={queue.user?.mobilityStatus || ''}
                            hasAppointment={queue.hasAppointment}
                            hospitalName={queue.hospital?.name || queue.hospitalName || ''}
                            bookingTime={queue.bookingTime || ''}
                            requestDate={queue.requestDate}
                            isEditMode={isEditMode}
                            editedData={editedData}
                            onDataChange={handleDataChange}
                            hospitals={hospitals}
                        />

                        <AppointmentImageSection
                            appointmentImage={queue.appointmentImage}
                        />

                        <EquipmentCheckboxes
                            requiredEquipment={isEditMode ? editedData.requiredEquipment : (queue.requiredEquipment || '')}
                            isEditMode={isEditMode}
                            onToggle={toggleEquipment}
                        />

                        { }
                        <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">จิตอาสาแคร์ยู</h4>
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${queue.wantCareU
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                                }`}>
                                <span>{queue.wantCareU ? 'ต้องการจิตอาสาแคร์ยูไปเป็นเพื่อน' : 'ไม่ต้องการ CareU'}</span>
                            </div>
                        </div>

                        {(isEditMode || queue.adminNote) && (
                            <div className="mt-4">
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    {isJsonChangeLog(queue.adminNote) ? 'ประวัติการแก้ไขข้อมูลคำร้อง' : 'หมายเหตุเจ้าหน้าที่'}
                                </label>
                                {isEditMode ? (
                                    <textarea
                                        value={editedData.adminNote}
                                        onChange={(e) => setEditedData({ ...editedData, adminNote: e.target.value })}
                                        placeholder="เช่น มีคนร่วมเดินทาง 1 คน, ต้องเตรียมรถเข็นเพิ่ม"
                                        rows={3}
                                        className="w-full px-4 py-2 bg-white border border-blue-300 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                    />
                                ) : (() => {
                                    if (isJsonChangeLog(queue.adminNote)) {
                                        try {
                                            const changes = JSON.parse(queue.adminNote!);
                                            return (
                                                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-gray-800 space-y-2">
                                                    <div className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                                                        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        ข้อมูลที่มีการแก้ไข:
                                                    </div>
                                                    <div className="space-y-1.5 text-xs sm:text-sm">
                                                        {changes.hospitalName && (
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-medium text-amber-900 min-w-[75px]">โรงพยาบาล:</span>
                                                                <span className="line-through text-slate-400">{changes.hospitalName.from}</span>
                                                                <span className="text-amber-600 font-bold">➔</span>
                                                                <span className="font-semibold text-emerald-700">{changes.hospitalName.to}</span>
                                                            </div>
                                                        )}
                                                        {changes.bookingTime && (
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-medium text-amber-900 min-w-[75px]">ช่วงเวลา:</span>
                                                                <span className="line-through text-slate-400">{changes.bookingTime.from}</span>
                                                                <span className="text-amber-600 font-bold">➔</span>
                                                                <span className="font-semibold text-emerald-700">{changes.bookingTime.to}</span>
                                                            </div>
                                                        )}
                                                        {changes.requestDate && (
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-medium text-amber-900 min-w-[75px]">วันที่นัดหมาย:</span>
                                                                <span className="line-through text-slate-400">{changes.requestDate.from}</span>
                                                                <span className="text-amber-600 font-bold">➔</span>
                                                                <span className="font-semibold text-emerald-700">{changes.requestDate.to}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        } catch {}
                                    }
                                    return (
                                        <div className="px-4 py-2.5 rounded-lg text-sm bg-amber-50 border border-amber-200 text-gray-800 whitespace-pre-wrap">
                                            {queue.adminNote}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    { }
                    <ModalActions
                        isEditMode={isEditMode}
                        queueStatus={queue.status}
                        userRole={userRole}
                        executiveApprovalEnabled={executiveApprovalEnabled}
                        onCancel={handleCancel}
                        onSave={handleSave}
                        onReject={handleReject}
                        onApprove={handleApprove}
                        onResubmitToExecutive={handleResubmitToExecutive}
                        onClose={onClose}
                    />
                </div>
            </div>
        </>
    );
}
