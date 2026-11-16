'use client';

import { CaregiverPatientRequest } from './CaregiverRequestTable';

interface CaregiverRequestDetailModalProps {
    request: CaregiverPatientRequest;
    onClose: () => void;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
    FAMILY: 'ครอบครัว',
    RELATIVE: 'ญาติ',
    CLOSE_PERSON: 'คนใกล้ชิด',
};

export default function CaregiverRequestDetailModal({
    request,
    onClose,
    onApprove,
    onReject
}: CaregiverRequestDetailModalProps) {
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 scrollbar-hide">
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
                <div className="px-8 py-5 flex items-center justify-between border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">รายละเอียดคำร้อง</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                { }
                <div className="p-8 overflow-y-auto custom-scrollbar">

                    { }
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-lg font-bold text-slate-800">ข้อมูลผู้ดูแลประชาชน</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ดูแลประชาชน</label>
                                <div className="w-full px-4 py-2.5 bg-[#EFF3F9] rounded-lg border border-slate-200 text-slate-700 font-medium">
                                    {request.caregiver?.displayName || '-'} {request.caregiver?.idCard ? `- ${request.caregiver.idCard.slice(-4)}` : ''}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทร</label>
                                <div className="w-full px-4 py-2.5 bg-[#EFF3F9] rounded-lg border border-slate-200 text-slate-700 font-medium">
                                    {request.caregiver?.phone || '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    { }
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-3">ข้อมูลประชาชน</h3>
                        <div className="space-y-4">
                            {request.patient?.pictureUrl && (
                                <div className="mb-4 flex justify-center">
                                    <img src={request.patient.pictureUrl} alt="Patient Profile" className="w-32 h-32 rounded-full object-cover border-4 border-slate-100" />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                                    <div className="w-full px-4 py-2.5 bg-[#EFF3F9] rounded-lg border border-slate-200 text-slate-700 font-medium">
                                        {request.patient?.displayName || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">รหัสบัตรประชาชน</label>
                                    <div className="w-full px-4 py-2.5 bg-[#EFF3F9] rounded-lg border border-slate-200 text-slate-700 font-medium">
                                        {request.patient?.idCard || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">เพศ</label>
                                    <div className="w-full px-4 py-2.5 bg-[#EFF3F9] rounded-lg border border-slate-200 text-slate-700 font-medium">
                                        {request.patient?.gender === 'male' ? 'ชาย' : request.patient?.gender === 'female' ? 'หญิง' : '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">วัน/เดือน/ปีเกิด</label>
                                    <div className="w-full px-4 py-2.5 bg-[#EFF3F9] rounded-lg border border-slate-200 text-slate-700 font-medium">
                                        {request.patient?.birthDate ? new Date(request.patient.birthDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทร</label>
                                    <div className="w-full px-4 py-2.5 bg-[#EFF3F9] rounded-lg border border-slate-200 text-slate-700 font-medium">
                                        {request.patient?.phone || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">สถานะผู้ป่วย</label>
                                    <div className="w-full px-4 py-2.5 bg-[#EFF3F9] rounded-lg border border-slate-200 text-slate-700 font-medium">
                                        {request.patient?.mobilityStatus === 'BEDRIDDEN' ? 'ผู้ป่วยติดเตียง (กลุ่มสีแดง)' : request.patient?.mobilityStatus === 'WHEELCHAIR' ? 'ผู้ป่วยติดรถเข็น (กลุ่มสีเหลือง)' : request.patient?.mobilityStatus === 'WALKING' ? 'เดินได้ปกติ (กลุ่มสีเขียว)' : '-'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">โรคประจำตัว</label>
                                <div className="w-full px-4 py-2.5 bg-[#EFF3F9] rounded-lg border border-slate-200 text-slate-700 font-medium">
                                    {request.patient?.diseases?.length
                                        ? request.patient.diseases.map(d => d.customDiseaseName || d.disease.name).join(', ')
                                        : 'ไม่มี'}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ที่อยู่ประชาชน</label>
                                <div className="w-full px-4 py-2.5 bg-[#EFF3F9] rounded-lg border border-slate-200 text-slate-700 font-medium">
                                    {request.patient?.addressDetail ? `${request.patient.addressDetail} ` : ''}
                                    {request.patient?.villageName ? `หมู่บ้าน: ${request.patient.villageName} ` : ''}
                                    {request.patient?.subdistrictName ? `ต.${request.patient.subdistrictName} ` : ''}
                                    {request.patient?.districtName ? `อ.${request.patient.districtName} ` : ''}
                                    {request.patient?.provinceName ? `จ.${request.patient.provinceName}` : ''}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">ความสัมพันธ์</label>
                                    <div className="w-full px-4 py-2.5 bg-[#EFF3F9] rounded-lg border border-slate-200 text-slate-700 font-medium">
                                        {RELATIONSHIP_LABELS[request.relationship] || request.relationship}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">รายละเอียดเพิ่มเติม</label>
                                    <div className="w-full px-4 py-2.5 bg-[#EFF3F9] rounded-lg border border-slate-200 text-slate-700 font-medium">
                                        {request.additionalDetails || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    { }
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">หลักฐานยืนยันความสัมพันธ์</label>
                        <div className="w-full border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-50 text-slate-400">
                            {request.documentUrl ? (
                                <img
                                    src={request.documentUrl}
                                    alt="Evidence"
                                    className="w-full rounded-md object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center p-4 h-48">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-50">
                                        <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19Z" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M21 15L16 10L5 21" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p className="text-sm font-medium text-center max-w-xs">
                                        ภาพถ่าย บัตรประจำตัวประชาชนของผู้ดูแลประชาชนและประชาชน
                                        <br />ถ่ายร่วมกันในภาพเดียว
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    { }
                    <div className="flex items-start gap-3 mt-4">
                        <div className="mt-0.5 relative flex items-center">
                            <input
                                type="checkbox"
                                checked={true}
                                readOnly
                                className="h-5 w-5 rounded border-slate-300 text-green-600 focus:ring-green-600 cursor-not-allowed opacity-60"
                            />
                        </div>
                        <label className="text-sm text-slate-600 leading-tight">
                            ข้าพเจ้ารับรองว่าข้อมูลเป็นความจริงและยินยอมให้เทศบาลตรวจสอบ
                        </label>
                    </div>

                    { }
                    {request.status === 'REJECTED' && request.rejectReason && (
                        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100">
                            <h4 className="text-red-800 font-semibold mb-1">ไม่อนุมัติเนื่องจาก:</h4>
                            <p className="text-red-700 text-sm">{request.rejectReason}</p>
                        </div>
                    )}
                </div>

                { }
                <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-white">
                    {request.status === 'PENDING' ? (
                        <>
                            <button
                                onClick={() => onReject(request.id)}
                                className="min-w-[120px] py-2.5 px-4 bg-white border border-red-500 text-red-500 rounded-lg font-medium hover:bg-red-50 transition-colors"
                            >
                                ไม่อนุมัติ
                            </button>
                            <button
                                onClick={() => onApprove(request.id)}
                                className="min-w-[120px] py-2.5 px-4 bg-[#1E7D55] text-white rounded-lg font-medium hover:bg-[#165c40] transition-colors shadow-sm"
                            >
                                อนุมัติ
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="min-w-[100px] py-2.5 px-4 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                        >
                            ปิด
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
