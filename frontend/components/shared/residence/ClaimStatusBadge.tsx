'use client';

import { CLAIM_STATUS_MAP, type ResidenceClaimStatus } from './types';

interface ClaimStatusBadgeProps {
  status: ResidenceClaimStatus;
  className?: string;
}

export default function ClaimStatusBadge({ status, className = '' }: ClaimStatusBadgeProps) {
  const config = CLAIM_STATUS_MAP[status] || CLAIM_STATUS_MAP.SUBMITTED;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}
      style={{ color: config.color, backgroundColor: config.bgColor }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}
