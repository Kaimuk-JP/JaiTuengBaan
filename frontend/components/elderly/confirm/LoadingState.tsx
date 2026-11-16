export function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-6x">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-2x"></div>
            <p className="typo-body text-text-tertiary">กำลังโหลดข้อมูล...</p>
        </div>
    );
}
