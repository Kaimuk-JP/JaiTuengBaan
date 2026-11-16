'use client';

interface SeverityBadgeProps {
    level: string;
    className?: string;
}

const SEVERITY_CONFIG: Record<string, { style: string; label: string }> = {
    GREEN: { style: 'bg-green-100 text-green-700', label: 'ทั่วไป' },
    YELLOW: { style: 'bg-yellow-100 text-yellow-800', label: 'ต้องดูแลเพิ่ม' },
    RED: { style: 'bg-red-100 text-red-700', label: 'ต้องดูแลใกล้ชิด' },
};

export default function SeverityBadge({ level, className = '' }: SeverityBadgeProps) {
    const config = SEVERITY_CONFIG[level] || { style: 'bg-gray-100 text-gray-700', label: level };

    return (
        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${config.style} ${className}`}>
            {config.label}
        </span>
    );
}

export { SEVERITY_CONFIG };
