'use client';

interface MobilityBadgeProps {
    mobilityStatus: string;
    className?: string;
}

const MOBILITY_CONFIG: Record<string, { style: string; label: string }> = {
    WALKING: { style: 'bg-apple-soft text-brand-primary', label: 'เดินได้ปกติ' },
    WHEELCHAIR: { style: 'bg-saffron-light-soft text-saffron-medium-dark', label: 'ต้องดูแลเพิ่ม' },
    BEDRIDDEN: { style: 'bg-fuan-light text-fuan-dark', label: 'ต้องดูแลใกล้ชิด' },
};

export default function MobilityBadge({ mobilityStatus, className = '' }: MobilityBadgeProps) {
    const config = MOBILITY_CONFIG[mobilityStatus] || { style: 'bg-gray-100 text-gray-700', label: mobilityStatus };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.style} ${className}`}>
            {config.label}
        </span>
    );
}

export { MOBILITY_CONFIG };
