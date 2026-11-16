'use client';

interface MapControlsProps {
    isTracking: boolean;
    isUpdatingStatus: boolean;
    activeJobStatus?: string;
    showTraffic?: boolean;
    onToggleTracking: () => void;
    onExitFullscreen: () => void;
    onUpdateStatus: (status: 'COMPLETED') => void;
    onToggleTraffic?: () => void;
}

export default function MapControls({
    isTracking,
    isUpdatingStatus,
    activeJobStatus,
    showTraffic = false,
    onToggleTracking,
    onExitFullscreen,
    onUpdateStatus,
    onToggleTraffic
}: MapControlsProps) {
    return (
        <div className="absolute right-4 bottom-4 z-[1000] flex flex-col gap-3">
            {onToggleTraffic && (
                <button
                    onClick={onToggleTraffic}
                    className={`p-3 rounded-full shadow-lg transition-all ${showTraffic ? 'bg-amber-500 text-white' : 'bg-white text-text-secondary'
                        }`}
                    title={showTraffic ? 'ปิดสภาพจราจร' : 'แสดงสภาพจราจร'}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="2" width="12" height="20" rx="2" />
                        <circle cx="12" cy="7" r="1.5" fill={showTraffic ? 'currentColor' : 'none'} />
                        <circle cx="12" cy="12" r="1.5" fill={showTraffic ? 'currentColor' : 'none'} />
                        <circle cx="12" cy="17" r="1.5" fill={showTraffic ? 'currentColor' : 'none'} />
                    </svg>
                </button>
            )}

            <button
                onClick={onToggleTracking}
                className={`p-3 rounded-full shadow-lg transition-all ${isTracking ? 'bg-brand-primary text-white' : 'bg-white text-text-secondary'
                    }`}
            >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
            </button>

            <button
                onClick={onExitFullscreen}
                className="p-3 rounded-full shadow-lg bg-white text-text-secondary hover:bg-background-hover"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {activeJobStatus === 'PICKING_UP' && (
                <button
                    onClick={() => onUpdateStatus('COMPLETED')}
                    disabled={isUpdatingStatus}
                    className="px-4 py-3 bg-brand-primary text-white rounded-full font-semibold hover:bg-btn-hover disabled:bg-btn-disabled shadow-lg"
                >
                    {isUpdatingStatus ? '⏳' : ' ส่งถึงบ้าน'}
                </button>
            )}
        </div>
    );
}
