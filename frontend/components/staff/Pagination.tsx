'use client';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    total?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
    onPageChange: (page: number) => void;
    showPageNumbers?: boolean;
    variant?: 'default' | 'sticky';
    className?: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    total,
    hasNextPage,
    hasPrevPage,
    onPageChange,
    showPageNumbers = true,
    variant = 'default',
    className = '',
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const prevDisabled = hasPrevPage === undefined ? currentPage <= 1 : !hasPrevPage;
    const nextDisabled = hasNextPage === undefined ? currentPage >= totalPages : !hasNextPage;

    const getPageNumbers = () => {
        const pages: number[] = [];
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, currentPage + 2);

        if (currentPage <= 2) {
            end = Math.min(5, totalPages);
        }
        if (currentPage >= totalPages - 1) {
            start = Math.max(1, totalPages - 4);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const wrapperClasses =
        variant === 'sticky'
            ? `sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between z-30 ${className}`
            : `flex items-center justify-between py-6 border-t border-slate-200 ${className}`;

    return (
        <div className={wrapperClasses}>
            <p className="text-sm font-medium text-slate-600">
                {total !== undefined ? `แสดงหน้า ${currentPage} จาก ${totalPages}` : `หน้า ${currentPage} จาก ${totalPages}`}
            </p>
            <div className="flex gap-2">
                {}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={prevDisabled}
                    className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    ก่อนหน้า
                </button>

                {}
                {showPageNumbers && getPageNumbers().map((pageNum) => (
                    <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${pageNum === currentPage
                            ? 'bg-brand-primary text-white'
                            : 'border border-slate-300 hover:bg-slate-50 text-slate-700'
                            }`}
                    >
                        {pageNum}
                    </button>
                ))}

                {}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={nextDisabled}
                    className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    ถัดไป
                </button>
            </div>
        </div>
    );
}
