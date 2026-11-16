'use client';

export interface CaregiverPatientRequest {
    id: number;
    caregiver: {
        id: number;
        displayName: string;
        phone: string;
        pictureUrl?: string;
        idCard?: string;
    };
    patient: {
        id: number;
        displayName: string;
        firstName?: string;
        lastName?: string;
        phone: string;
        pictureUrl?: string;
        mobilityStatus: string;
        idCard?: string;
        gender?: string;
        birthDate?: string;
        villageName?: string;
        subdistrictName?: string;
        districtName?: string;
        provinceName?: string;
        addressDetail?: string;
        diseases?: Array<{
            disease: { name: string };
            customDiseaseName?: string;
        }>;
    };
    relationship: string;
    additionalDetails?: string;
    documentUrl?: string;
    status: string;
    rejectReason?: string;
    createdAt: string;
}

interface CaregiverRequestTableProps {
    loading: boolean;
    requests: CaregiverPatientRequest[];
    onViewDetail: (request: CaregiverPatientRequest) => void;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
    FAMILY: 'ครอบครัว',
    RELATIVE: 'ญาติ',
    CLOSE_PERSON: 'คนใกล้ชิด',
};

const statusLabels: Record<string, { text: string; color: string; bg: string }> = {
    PENDING: { text: 'รอตรวจสอบ', color: '#F59E0B', bg: '#FEF3C7' },
    APPROVED: { text: 'อนุมัติแล้ว', color: '#10B981', bg: '#D1FAE5' },
    REJECTED: { text: 'ไม่อนุมัติ', color: '#EF4444', bg: '#FEE2E2' },
};

export default function CaregiverRequestTable({ loading, requests, onViewDetail }: CaregiverRequestTableProps) {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-20 text-slate-500">ไม่พบคำร้อง</div>
        );
    }

    return (
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-50 text-gray-900 border-b border-gray-100">
                    <th className="px-6 py-4 font-semibold text-sm">ชื่อผู้ดูแลประชาชน</th>
                    <th className="px-6 py-4 font-semibold text-sm">ชื่อประชาชนที่ดูแล</th>
                    <th className="px-6 py-4 font-semibold text-sm">ความสัมพันธ์</th>
                    <th className="px-6 py-4 font-semibold text-sm text-center">สถานะ</th>
                    <th className="px-6 py-4 font-semibold text-sm">วันที่ยื่นคำร้อง</th>
                    <th className="px-6 py-4 font-semibold text-sm text-right">รายละเอียด</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-700 text-sm font-medium">
                            {req.caregiver?.displayName || '-'}
                        </td>
                        <td className="px-6 py-4 text-slate-700 text-sm font-medium">
                            {req.patient?.displayName || '-'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                            {RELATIONSHIP_LABELS[req.relationship] || req.relationship}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                    backgroundColor: statusLabels[req.status]?.bg || '#F3F4F6',
                                    color: statusLabels[req.status]?.color || '#4B5563',
                                }}
                            >
                                {statusLabels[req.status]?.text || req.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                            {new Date(req.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                            {req.status === 'PENDING' ? (
                                <button
                                    onClick={() => onViewDetail(req)}
                                    className="inline-block bg-[#1E7D55] text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-[#165c40] transition-colors shadow-sm"
                                >
                                    ตรวจสอบ
                                </button>
                            ) : req.status === 'APPROVED' ? (
                                <span className="inline-block bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-medium">
                                    อนุมัติแล้ว
                                </span>
                            ) : req.status === 'REJECTED' ? (
                                <span className="inline-block bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-xs font-medium">
                                    ปฏิเสธแล้ว
                                </span>
                            ) : (
                                <button
                                    onClick={() => onViewDetail(req)}
                                    className="inline-block bg-gray-500 text-white px-4 py-1.5 rounded-full text-xs font-medium"
                                >
                                    ดูรายละเอียด
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
