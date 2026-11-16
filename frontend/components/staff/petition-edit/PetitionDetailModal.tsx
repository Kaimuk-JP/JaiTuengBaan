'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import type { EditRequest } from './PetitionTable';

interface PetitionDetailModalProps {
    request: EditRequest;
    onClose: () => void;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
}

const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
        displayName: 'ชื่อ-สกุล',
        firstName: 'ชื่อ',
        lastName: 'นามสกุล',
        phone: 'เบอร์โทรศัพท์',
        relativePhone: 'เบอร์โทรญาติ',
        address: 'ที่อยู่',
        addressDetail: 'รายละเอียดที่อยู่',
        idCard: 'เลขบัตรประชาชน',
        gender: 'เพศ',
        birthDate: 'วันเกิด',
        mobilityStatus: 'สถานะประชาชน',
        medicalConditions: 'โรคประจำตัว (เดิม)',
        diseaseIds: 'โรคประจำตัว (เลือกจากระบบ)',
        customDiseases: 'โรคประจำตัว (อื่นๆ)',
        lat: 'ละติจูด',
        lng: 'ลองจิจูด',
        hospital: 'โรงพยาบาล',
        placeName: 'สถานที่/ชื่อสถานที่',
        houseNo: 'บ้านเลขที่',
        road: 'ถนน',
        neighbourhood: 'ชุมชน/ละแวก',
        villageName: 'หมู่บ้าน',
        subdistrictName: 'ตำบล/แขวง',
        districtName: 'อำเภอ/เขต',
        provinceName: 'จังหวัด',
        postalCode: 'รหัสไปรษณีย์',
        country: 'ประเทศ',
    };
    return labels[field] || field;
};

const formatMobilityStatus = (status: string) => {
    const labels: Record<string, string> = {
        WALKING: 'เดินได้ปกติ',
        WHEELCHAIR: 'ต้องดูแลเพิ่ม',
        BEDRIDDEN: 'ต้องดูแลใกล้ชิด',
    };
    return labels[status] || status;
};

const formatGender = (gender: string) => {
    return gender === 'male' ? 'ชาย' : gender === 'female' ? 'หญิง' : gender;
};

const getChangesCount = (request: EditRequest) => {
    const count = Object.keys(request.requestedChanges || {}).length;
    if (request.newPictureUrl) return count + 1;
    return count;
};

export default function PetitionDetailModal({
    request,
    onClose,
    onApprove,
    onReject
}: PetitionDetailModalProps) {
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [diseaseMap, setDiseaseMap] = useState<Record<number, string>>({});
    const [isLoadingDiseases, setIsLoadingDiseases] = useState(false);

    useEffect(() => {
        const fetchDiseaseDetails = async () => {
            if (!request.requestedChanges?.diseaseIds) return;

            const ids: number[] = Array.isArray(request.requestedChanges.diseaseIds)
                ? request.requestedChanges.diseaseIds
                : [];

            if (ids.length === 0) return;

            setIsLoadingDiseases(true);
            try {
                const response = await fetch(`${getApiUrl()}/diseases`);
                if (response.ok) {
                    const data = await response.json();
                    const map: Record<number, string> = {};
                    if (Array.isArray(data)) {
                        data.forEach((d: any) => {
                            map[d.id] = d.name;
                        });
                        setDiseaseMap(map);
                    }
                }
            } catch (error) {
                console.error("Error fetching disease details", error);
            } finally {
                setIsLoadingDiseases(false);
            }
        };

        fetchDiseaseDetails();
    }, [request]);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 scrollbar-hide">
                <style jsx global>{`
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
                { }
                <div className="px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">รายละเอียดคำร้อง</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>

                { }
                <div className="p-6">
                    { }
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                            {request.user?.pictureUrl ? (
                                <img
                                    src={request.user.pictureUrl}
                                    alt={request.user.displayName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-slate-400 font-bold text-2xl">
                                    {(request.user?.displayName || request.user?.firstName || '?').charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">
                                {request.user?.displayName || `${request.user?.firstName || ''} ${request.user?.lastName || ''}`.trim() || '-'}
                            </h3>
                            <p className="text-slate-500 text-sm">{request.user?.phone}</p>
                        </div>
                    </div>

                    { }
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4 mb-6">
                        <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">
                            ข้อมูลที่ขอแก้ไข ({getChangesCount(request)} รายการ)
                        </h4>

                        { }
                        <div className="space-y-3">
                            {Object.entries(request.requestedChanges || {}).map(([field, newValue]) => {
                                const currentValue = (request.user as any)?.[field];
                                let displayOld = currentValue || '-';
                                let displayNew = newValue as string | string[] || '-';

                                if (Array.isArray(displayOld)) displayOld = displayOld.join(', ');
                                if (Array.isArray(displayNew)) displayNew = displayNew.join(', ');

                                if (field === 'mobilityStatus') {
                                    displayOld = formatMobilityStatus(displayOld as string);
                                    displayNew = formatMobilityStatus(displayNew as string);
                                } else if (field === 'gender') {
                                    displayOld = formatGender(displayOld as string);
                                    displayNew = formatGender(displayNew as string);
                                } else if (field === 'lat' || field === 'lng') {
                                    if (displayOld !== '-') displayOld = Number(displayOld).toFixed(6);
                                    if (displayNew !== '-') displayNew = Number(displayNew).toFixed(6);
                                } else if (field === 'diseaseIds') {
                                    const allDiseases = (request.user as any).allDiseases || [];
                                    const oldIds = allDiseases.filter((d: any) => d.type === 'db').map((d: any) => d.id);
                                    displayOld = oldIds.length > 0 ?
                                        oldIds.map((id: number) => diseaseMap[id] || id).join(', ') : '-';

                                    const newIds = newValue as number[];
                                    displayNew = Array.isArray(newIds) && newIds.length > 0 ?
                                        newIds.map((id: number) => diseaseMap[id] || (isLoadingDiseases ? '...' : id)).join(', ') : '-';
                                } else if (field === 'birthDate' && displayNew) {
                                    displayNew = new Date(displayNew as string).toLocaleDateString('th-TH');
                                    if (displayOld !== '-') {
                                        displayOld = new Date(displayOld as string).toLocaleDateString('th-TH');
                                    }
                                }

                                return (
                                    <div key={field} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                        <span className="text-xs font-semibold text-slate-500 block mb-1.5">{getFieldLabel(field)}</span>
                                        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 text-sm">
                                            <span className="text-slate-400 line-through truncate">{displayOld}</span>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            <span className="text-blue-600 font-medium truncate">{displayNew}</span>
                                        </div>
                                    </div>
                                );
                            })}

                            { }
                            {request.newPictureUrl && (
                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <span className="text-xs font-semibold text-slate-500 block mb-2">รูปโปรไฟล์ใหม่</span>
                                    <div className="flex gap-4 items-center">
                                        { }
                                        {request.user?.pictureUrl ? (
                                            <img
                                                src={request.user.pictureUrl}
                                                alt="Current profile"
                                                onClick={() => setPreviewImageUrl(request.user?.pictureUrl || null)}
                                                className="w-16 h-16 rounded-full object-cover border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                                                title="คลิกเพื่อดูรูปขนาดใหญ่"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">ไม่มีรูป</div>
                                        )}
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        { }
                                        <img
                                            src={request.newPictureUrl}
                                            alt="New profile"
                                            onClick={() => setPreviewImageUrl(request.newPictureUrl || null)}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-blue-400 cursor-pointer hover:opacity-80 transition-opacity"
                                            title="คลิกเพื่อดูรูปขนาดใหญ่"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    { }
                    {request.status === 'REJECTED' && request.rejectReason && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex gap-3">
                            <div className="text-red-500 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#f59e0b" />
                                    <line x1="12" y1="9" x2="12" y2="13" stroke="#f59e0b" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" stroke="#f59e0b" />
                                </svg>                                 </div>
                            <div>
                                <span className="text-sm text-red-700 font-bold block mb-1">เหตุผลที่ไม่อนุมัติ</span>
                                <p className="text-sm text-red-600">{request.rejectReason}</p>
                            </div>
                        </div>
                    )}

                    { }
                    {request.status === 'PENDING' && (
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => onApprove(request.id)}
                                className="flex-1 bg-brand-primary hover:bg-btn-hover text-white text-sm font-medium py-2.5 rounded-lg transition-colors shadow-sm shadow-brand-primary/20"
                            >
                                อนุมัติ
                            </button>
                            <button
                                onClick={() => onReject(request.id)}
                                className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium py-2.5 rounded-lg transition-colors"
                            >
                                ไม่อนุมัติ
                            </button>
                        </div>
                    )}
                </div>
            </div>

            { }
            {previewImageUrl && (
                <div
                    className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
                    onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(null); }}
                >
                    <div className="relative max-w-2xl max-h-[90vh]">
                        <button
                            onClick={() => setPreviewImageUrl(null)}
                            className="absolute -top-10 right-0 text-white hover:text-text-placeholder transition-colors"
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <img
                            src={previewImageUrl}
                            alt="Preview"
                            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
