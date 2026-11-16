'use client';

interface PersonnelPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function PersonnelPagination({
    currentPage,
    totalPages,
    onPageChange
}: PersonnelPaginationProps) {
    if (totalPages <= 0) return null;

    return (
        <div className="fixed h-[73px] bottom-0 left-0 md:left-[280px] right-0 bg-white px-6 py-4 flex items-center justify-between z-30 shadow-top">
            <p className="text-sm font-medium text-text-secondary">
                หน้า {currentPage} จาก {totalPages}
            </p>
            <div className="flex gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium border border-border-default rounded-lg hover:bg-state-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ก่อนหน้า
                </button>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium border border-border-default rounded-lg hover:bg-state-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ถัดไป
                </button>
            </div>
        </div>
    );
}
