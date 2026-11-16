'use client';

interface EditRequest {
    id: number;
    userId: number;
    user: {
        id: number;
        displayName: string;
        firstName?: string;
        lastName?: string;
        phone: string;
        pictureUrl?: string;
        idCard?: string;
        gender?: string;
        address?: string;
        addressDetail?: string;
        placeName?: string;
        houseNo?: string;
        road?: string;
        neighbourhood?: string;
        villageName?: string;
        subdistrictName?: string;
        districtName?: string;
        provinceName?: string;
        postalCode?: string;
        country?: string;
        mobilityStatus?: string;
        medicalConditions?: string | string[];
        birthDate?: string;
        lat?: number;
        lng?: number;
    };
    requestedChanges: Record<string, any>;
    newPictureUrl?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectReason?: string;
    reviewedAt?: string;
    reviewer?: {
        id: number;
        displayName: string;
    };
    createdAt: string;
}

interface PetitionTableProps {
    loading: boolean;
    requests: EditRequest[];
    onViewDetail: (request: EditRequest) => void;
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

const getChangesCount = (request: EditRequest) => {
    const count = Object.keys(request.requestedChanges || {}).length;
    if (request.newPictureUrl) return count + 1;
    return count;
};

const getChangesSummary = (request: EditRequest) => {
    const changes = request.requestedChanges || {};
    const fields = Object.keys(changes).slice(0, 2).map(f => getFieldLabel(f));
    if (request.newPictureUrl) fields.push('รูปโปรไฟล์');

    const totalCount = getChangesCount(request);
    if (totalCount > 2) {
        return fields.join(', ') + ` และอื่นๆ (${totalCount} รายการ)`;
    }
    return fields.join(', ');
};

export default function PetitionTable({ loading, requests, onViewDetail }: PetitionTableProps) {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-20 text-slate-500">ไม่พบคำร้องขอแก้ไขข้อมูล</div>
        );
    }

    return (
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-50 text-gray-900 border-b border-gray-100">
                    <th className="px-6 py-4 font-semibold text-sm">ชื่อผู้ยื่นคำร้อง</th>
                    <th className="px-6 py-4 font-semibold text-sm">เบอร์โทรศัพท์</th>
                    <th className="px-6 py-4 font-semibold text-sm">รายการที่ขอแก้ไข</th>
                    <th className="px-6 py-4 font-semibold text-sm text-center">สถานะ</th>
                    <th className="px-6 py-4 font-semibold text-sm">วันที่ยื่นคำร้อง</th>
                    <th className="px-6 py-4 font-semibold text-sm text-right">รายละเอียด</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-700 text-sm font-medium">
                            {req.user?.displayName || `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || 'ไม่ระบุ'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                            {req.user?.phone || '-'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm max-w-xs truncate" title={getChangesSummary(req)}>
                            {getChangesSummary(req)}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                {req.status === 'APPROVED' ? 'อนุมัติ' :
                                    req.status === 'REJECTED' ? 'ปฏิเสธ' : 'รอตรวจสอบ'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700 text-sm">
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
                                <button
                                    onClick={() => onViewDetail(req)}
                                    className="inline-block bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
                                >
                                    ดูรายละเอียด
                                </button>
                            ) : req.status === 'REJECTED' ? (
                                <button
                                    onClick={() => onViewDetail(req)}
                                    className="inline-block bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
                                >
                                    ดูรายละเอียด
                                </button>
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

export type { EditRequest };
