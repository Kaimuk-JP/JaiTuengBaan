'use client';

export interface Queue {
    id: number;
    userId: number;
    user: {
        id: number;
        displayName: string;
        firstName?: string;
        lastName?: string;
        phone: string;
        mobilityStatus: string;
        addressDetail?: string;
        pictureUrl?: string;
        idCard?: string;
    };
    hospitalId?: number;
    hospital?: {
        id: number;
        name: string;
    };
    hospitalName?: string;
    requestDate: string;
    bookingTime?: string;
    appointmentImage?: string;
    hasAppointment: boolean;
    status: string;
    severityLevel: string;
    rejectReason?: string;
    createdAt: string;
    job?: {
        id: number;
        status: string;
        vltId?: string | number | null;
        careuId?: string | number | null;
        vehicleId?: number | null;
        vlt?: {
            id: number | string;
            firstName?: string;
            lastName?: string;
        };
        careu?: {
            id: number | string;
            firstName?: string;
            lastName?: string;
        };
        vehicle?: {
            id: number;
            licensePlate?: string;
            name?: string;
        };
    };
    wantCareU?: boolean;
}

interface PetitionTableProps {
    loading: boolean;
    requests: Queue[];
    onViewDetail: (queue: Queue) => void;
    onAssignClick?: (queue: Queue) => void;
    onReassignClick?: (queue: Queue) => void;
    onCancelClick?: (queue: Queue) => void;
    currentUserRole?: string;
    executiveApprovalEnabled?: boolean;
}

function getStatusDisplay(req: Queue, currentUserRole?: string, executiveApprovalEnabled = true) {
    const jobStatus = req.job?.status;



    if (req.status === 'PENDING_MUNICIPAL') {
        return { type: 'action', label: 'ตรวจสอบ', priority: 1 };
    }
    if (req.status === 'PENDING_EXECUTIVE') {
        if (!executiveApprovalEnabled) {
            return { type: 'executive-waiting', label: 'รอดำเนินการ (คิวเก่า)', priority: 2 };
        }
        return (currentUserRole === 'EXECUTIVE' || currentUserRole === 'ADMIN')
            ? { type: 'executive-action', label: 'ตรวจสอบผู้บริหาร', priority: 2 }
            : { type: 'executive-waiting', label: 'รอผู้บริหารอนุมัติ', priority: 2 };
    }
    if (req.status === 'EXECUTIVE_REJECTED') {
        if (!executiveApprovalEnabled) {
            return { type: 'executive-rejected', label: 'รอเจ้าหน้าที่แก้ไข', priority: 1 };
        }
        return { type: 'executive-rejected', label: 'ผู้บริหารส่งกลับแก้ไข', priority: 1 };
    }
    if (req.status === 'CONFIRMED' && (!jobStatus || jobStatus === 'OPEN' || !req.job?.vltId || (req.wantCareU && !req.job?.careuId))) {
        let label = 'มอบหมายงาน';
        if (req.job?.vltId && req.wantCareU && !req.job?.careuId) {
            label = 'มอบหมายแคร์ยูใหม่';
        } else if (!req.job?.vltId && req.job?.careuId) {
            label = 'มอบหมายคนขับใหม่';
        }
        return { type: 'assign', label, priority: 3 };
    }
    if (req.status === 'APPROVED') {
        return { type: 'waiting', label: 'รอประชาชนยืนยัน', priority: 4 };
    }
    if (jobStatus === 'ASSIGNED') {
        return { type: 'badge-blue', label: 'รอให้บริการ', priority: 4 };
    }
    if (jobStatus === 'ACCEPTED') {
        return { type: 'badge-teal', label: 'กำลังดำเนินการ', priority: 5 };
    }
    if (jobStatus === 'PICKING_UP') {
        return { type: 'badge-indigo', label: 'กำลังไปรับประชาชน', priority: 5 };
    }
    if (jobStatus === 'IN_TRANSIT') {
        return { type: 'badge-purple', label: 'กำลังเดินทางไปโรงพยาบาล', priority: 6 };
    }
    if (jobStatus === 'RETURN_HOME') {
        return { type: 'badge-purple', label: 'กำลังพาประชาชนกลับบ้าน', priority: 6 };
    }
    if (jobStatus === 'RETURN_OFFICE') {
        return { type: 'badge-green', label: 'กำลังกลับศูนย์', priority: 6 };
    }
    if (jobStatus === 'COMPLETED') {
        return { type: 'badge-green', label: 'เสร็จสิ้น', priority: 7 };
    }
    if (req.status === 'REJECTED') {
        return { type: 'badge-red', label: 'ปฏิเสธ', priority: 8 };
    }
    if (req.status === 'CANCELLED_BY_USER' || req.status === 'CANCELLED_BY_MUNICIPAL' || jobStatus === 'CANCELLED') {
        return { type: 'badge-gray', label: 'ยกเลิก', priority: 9 };
    }
    return { type: 'other', label: 'ดูรายละเอียด', priority: 10 };
}

export { getStatusDisplay };

export default function PetitionTable({ loading, requests, onViewDetail, onAssignClick, onReassignClick, onCancelClick, currentUserRole, executiveApprovalEnabled = true }: PetitionTableProps) {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-20 text-slate-500">ไม่พบข้อมูล</div>
        );
    }

    const renderStatusCell = (req: Queue) => {
        const status = getStatusDisplay(req, currentUserRole, executiveApprovalEnabled);

        switch (status.type) {
            case 'overdue':
                return (
                    <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-xs font-medium">
                        เลยกำหนด
                    </span>
                );
            case 'action':
                return (
                    <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full text-xs font-medium">
                        รอตรวจสอบ
                    </span>
                );
            case 'assign':
                return (
                    <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-medium">
                        รอมอบหมาย
                    </span>
                );
            case 'executive-action':
                return (
                    <span className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 px-4 py-1.5 rounded-full text-xs font-medium">
                        รอผู้บริหารตรวจสอบ
                    </span>
                );
            case 'executive-waiting':
                return (
                    <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-xs font-medium">
                        รอผู้บริหารอนุมัติ
                    </span>
                );
            case 'executive-rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-xs font-medium">
                        ผู้บริหารส่งกลับแก้ไข
                    </span>
                );
            case 'waiting':
                return (
                    <div className="flex items-center justify-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-xs font-medium">
                            <svg className="w-3.5 h-3.5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            รอประชาชนยืนยัน
                        </span>
                        {onCancelClick && (
                            <button
                                onClick={() => onCancelClick(req)}
                                title="ยกเลิกคำร้อง"
                                className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-red-100 transition-colors border border-red-200"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                ยกเลิก
                            </button>
                        )}
                    </div>
                );
            case 'badge-blue':
            case 'badge-teal':
            case 'badge-indigo':
            case 'badge-purple':
            case 'badge-green':
            case 'badge-red':
            case 'badge-gray':
                return (
                    <div className="flex items-center justify-center w-full">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium ${status.type === 'badge-blue' ? 'bg-blue-100 text-blue-700' :
                            status.type === 'badge-teal' ? 'bg-teal-100 text-teal-700' :
                                status.type === 'badge-indigo' ? 'bg-indigo-100 text-indigo-700' :
                                    status.type === 'badge-purple' ? 'bg-purple-100 text-purple-700' :
                                        status.type === 'badge-green' ? 'bg-green-100 text-green-700' :
                                            status.type === 'badge-red' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-600'
                            }`}>
                            {status.type !== 'badge-gray' && (
                                <svg className={`w-3.5 h-3.5 ${status.type === 'badge-indigo' ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {(status.type === 'badge-blue' || status.type === 'badge-teal') && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
                                    {status.type === 'badge-indigo' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />}
                                    {status.type === 'badge-purple' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />}
                                    {status.type === 'badge-green' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                                    {status.type === 'badge-red' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
                                </svg>
                            )}
                            {status.label}
                        </span>
                    </div>
                );
            default:
                return <span className="text-gray-500 text-xs font-medium">-</span>;
        }
    };

    const renderActionCell = (req: Queue) => {
        const status = getStatusDisplay(req, currentUserRole, executiveApprovalEnabled);

        switch (status.type) {
            case 'overdue':
                return (
                    <button
                        onClick={() => onViewDetail(req)}
                        className="inline-flex items-center gap-1.5 bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-red-700 transition-colors shadow-sm opacity-80"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ดูรายละเอียด
                    </button>
                );
            case 'action':
            case 'executive-action':
                return (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => onViewDetail(req)}
                            className="inline-flex items-center justify-center bg-[#1E7D55] text-white py-1.5 rounded-full text-xs font-medium hover:bg-[#165c40] transition-colors shadow-sm w-[96px]"
                        >
                            {status.type === 'executive-action' ? 'อนุมัติ' : 'ตรวจสอบ'}
                        </button>
                        {onCancelClick && (
                            <button
                                onClick={() => onCancelClick(req)}
                                title="ยกเลิกคำร้อง"
                                className="inline-flex items-center justify-center bg-red-50 text-red-600 py-1.5 rounded-full text-xs font-medium hover:bg-red-100 transition-colors border border-red-200 w-[96px]"
                            >
                                ยกเลิก
                            </button>
                        )}
                    </div>
                );
            case 'assign':
                if (!onAssignClick) {
                    return <span className="text-gray-400 text-xs font-medium">-</span>;
                }
                return (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => onAssignClick?.(req)}
                            className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white py-1.5 rounded-full text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm w-[116px]"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            มอบหมายงาน
                        </button>
                        {onCancelClick && (
                            <button
                                onClick={() => onCancelClick(req)}
                                title="ยกเลิกคำร้อง"
                                className="inline-flex items-center justify-center gap-1 bg-red-50 text-red-600 py-1.5 rounded-full text-xs font-medium hover:bg-red-100 transition-colors border border-red-200 w-[116px]"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                ยกเลิก
                            </button>
                        )}
                    </div>
                );
            case 'badge-blue':
            case 'badge-teal':
            case 'badge-indigo':
            case 'badge-purple':
            case 'badge-green':
                if (!onReassignClick && !(onCancelClick && status.type !== 'badge-green')) {
                    return <span className="text-gray-400 text-xs font-medium">-</span>;
                }
                return (
                    <div className="flex items-center justify-center gap-2">
                        {onReassignClick && (
                            <button
                                onClick={() => onReassignClick(req)}
                                title="แก้ไขการมอบหมาย (รถ / คนขับ / แคร์ยู)"
                                className="inline-flex items-center justify-center gap-1 bg-amber-50 text-amber-700 py-1.5 rounded-full text-xs font-medium hover:bg-amber-100 transition-colors border border-amber-200 w-[84px]"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                แก้ไข
                            </button>
                        )}
                        {onCancelClick && status.type !== 'badge-green' && (
                            <button
                                onClick={() => onCancelClick(req)}
                                title="ยกเลิกคำร้อง"
                                className="inline-flex items-center justify-center gap-1 bg-red-50 text-red-600 py-1.5 rounded-full text-xs font-medium hover:bg-red-100 transition-colors border border-red-200 w-[84px]"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                ยกเลิก
                            </button>
                        )}
                    </div>
                );
            default:
                return (
                    <button
                        onClick={() => onViewDetail(req)}
                        className="inline-block bg-gray-500 text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-gray-600 transition-colors shadow-sm"
                    >
                        ดูรายละเอียด
                    </button>
                );
        }
    };

    return (
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-50 text-gray-900 border-b border-gray-100">
                    <th className="px-6 py-4 font-semibold text-sm">ชื่อผู้ยื่นคำร้อง</th>
                    <th className="px-6 py-4 font-semibold text-sm">ประเภทคำขอ</th>
                    <th className="px-6 py-4 font-semibold text-sm">โรงพยาบาล</th>
                    <th className="px-6 py-4 font-semibold text-sm">ช่วงเวลา</th>
                    <th className="px-6 py-4 font-semibold text-sm">วันที่</th>
                    <th className="px-6 py-4 font-semibold text-sm text-center">สถานะ</th>
                    <th className="px-6 py-4 font-semibold text-sm text-center">จัดการ</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-700 text-sm font-medium">
                            {req.user?.displayName || `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || '-'}
                        </td>
                        <td className="px-6 py-4 text-slate-700 text-sm">
                            {req.hasAppointment ? 'มีใบนัด' : 'ไม่มีใบนัด'}
                        </td>
                        <td className="px-6 py-4 text-slate-700 text-sm">
                            {req.hospital?.name || req.hospitalName || '-'}
                        </td>
                        <td className="px-6 py-4 text-slate-700 text-sm">
                            {req.bookingTime || '04.00 น. - 06.00 น.'}
                        </td>
                        <td className="px-6 py-4 text-slate-700 text-sm">
                            {new Date(req.requestDate).toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 text-center">
                            {renderStatusCell(req)}
                        </td>
                        <td className="px-6 py-4 text-center">
                            {renderActionCell(req)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
