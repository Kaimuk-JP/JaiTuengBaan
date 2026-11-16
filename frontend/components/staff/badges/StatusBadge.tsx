'use client';

interface StatusBadgeProps {
    status: string;
    className?: string;
}

const STATUS_CONFIG: Record<string, { style: string; label: string }> = {
    PENDING_MUNICIPAL: { style: 'bg-red-500 text-white', label: 'รอเทศบาลตรวจสอบ' },
    APPROVED: { style: 'bg-blue-500 text-white', label: 'อนุมัติแล้ว' },
    CONFIRMED: { style: 'bg-brand-primary text-white', label: 'ยืนยันแล้ว' },
    REJECTED: { style: 'bg-red-500 text-white', label: 'ไม่อนุมัติ' },
    CANCELLED_BY_USER: { style: 'bg-gray-500 text-white', label: 'ผู้ใช้ยกเลิก' },
    CANCELLED_BY_MUNICIPAL: { style: 'bg-rose-500 text-white', label: 'เทศบาลยกเลิก' },
    CANCELLED_BY_STAFF: { style: 'bg-rose-500 text-white', label: 'เจ้าหน้าที่ยกเลิก' },
    CANCELLED: { style: 'bg-gray-500 text-white', label: 'ยกเลิก' },
    PENDING: { style: 'bg-yellow-500 text-white', label: 'รอตรวจสอบ' },
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] || { style: 'bg-gray-500 text-white', label: status };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.style} ${className}`}>
            {config.label}
        </span>
    );
}

export { STATUS_CONFIG };
