'use client';

interface JobStatusBadgeProps {
    status: string;
    className?: string;
}

const JOB_STATUS_CONFIG: Record<string, { style: string; label: string }> = {
    PENDING: { style: 'bg-amber-100 text-amber-700', label: 'รอตรวจสอบ' },
    OPEN: { style: 'bg-yellow-100 text-yellow-700', label: 'รอให้บริการ' },
    ASSIGNED: { style: 'bg-yellow-100 text-yellow-700', label: 'รอให้บริการ' },
    ACCEPTED: { style: 'bg-blue-100 text-blue-700', label: 'กำลังดำเนินการ' },
    PICKING_UP: { style: 'bg-orange-100 text-orange-700', label: 'กำลังไปรับประชาชน' },
    PICKED_UP: { style: 'bg-sky-100 text-sky-700', label: 'รับประชาชนแล้ว' },
    IN_PROGRESS: { style: 'bg-orange-100 text-orange-700', label: 'กำลังดูแลประชาชน' },
    IN_TRANSIT: { style: 'bg-sky-100 text-sky-700', label: 'กำลังเดินทางไปโรงพยาบาล' },
    AT_HOSPITAL: { style: 'bg-cyan-100 text-cyan-700', label: 'อยู่ที่โรงพยาบาล' },
    RETURN_HOME: { style: 'bg-purple-100 text-purple-700', label: 'กำลังพาประชาชนกลับบ้าน' },
    AT_PATIENT_HOME: { style: 'bg-teal-100 text-teal-700', label: 'ส่งถึงบ้าน รอคนขับยืนยัน' },
    RETURN_OFFICE: { style: 'bg-indigo-100 text-indigo-700', label: 'กำลังกลับเทศบาล' },
    COMPLETED: { style: 'bg-brand-primary text-white', label: 'เสร็จสิ้น' },
    REJECTED: { style: 'bg-red-100 text-red-700', label: 'ปฏิเสธ' },
    CANCELLED: { style: 'bg-gray-100 text-gray-700', label: 'ยกเลิก' },
    PENDING_MUNICIPAL: { style: 'bg-yellow-100 text-yellow-700', label: 'รอตรวจสอบ' },
    APPROVED: { style: 'bg-green-100 text-green-700', label: 'อนุมัติ' },
    PENDING_EXECUTIVE: { style: 'bg-orange-100 text-orange-700', label: 'รอผู้บริหารอนุมัติ' },
    EXECUTIVE_REJECTED: { style: 'bg-red-100 text-red-700', label: 'ผู้บริหารส่งกลับแก้ไข' },
    CONFIRMED: { style: 'bg-green-100 text-green-700', label: 'ยืนยันแล้ว' },
    CANCELLED_BY_USER: { style: 'bg-gray-100 text-gray-700', label: 'ผู้ใช้ยกเลิก' },
    CANCELLED_BY_MUNICIPAL: { style: 'bg-rose-100 text-rose-700', label: 'เทศบาลยกเลิก' },
    CANCELLED_BY_STAFF: { style: 'bg-rose-100 text-rose-700', label: 'เจ้าหน้าที่ยกเลิก' },
};

export default function JobStatusBadge({ status, className = '' }: JobStatusBadgeProps) {
    const config = JOB_STATUS_CONFIG[status] || { style: 'bg-gray-100 text-gray-700', label: status };

    return (
        <span className={`inline-flex items-center justify-center min-w-[130px] px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${config.style} ${className}`}>
            {config.label}
        </span>
    );
}

export { JOB_STATUS_CONFIG };
