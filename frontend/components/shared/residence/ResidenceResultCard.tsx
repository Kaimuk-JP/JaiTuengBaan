'use client';

import type { ResidenceSearchResult } from './types';

interface ResidenceResultCardProps {
  result: ResidenceSearchResult;
  onSelect: (result: ResidenceSearchResult) => void;
}

export default function ResidenceResultCard({ result, onSelect }: ResidenceResultCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(result)}
      className="w-full text-left p-4 bg-white border border-[#C8CEDD] rounded-xl hover:border-brand-primary hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-primary/20 transition-colors">
          <svg className="w-5 h-5 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary text-sm leading-tight mb-1 line-clamp-1">
            {result.title}
          </p>

          <p className="text-xs text-text-tertiary leading-snug mb-2 line-clamp-2">
            {result.maskedAddress}
          </p>

          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-text-placeholder" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-xs text-text-tertiary">
              {result.municipality?.name || 'ไม่ระบุ'}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}
