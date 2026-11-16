'use client';

interface StaffHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
}

export default function StaffHeader({ title, subtitle, icon }: StaffHeaderProps) {
    return (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex flex-col min-w-0">
                <h1 className="ml-4 font-semibold text-gray-900 dark:text-white truncate leading-none" style={{ fontFamily: 'var(--font-prompt)', fontSize: '24px', letterSpacing: '-0.02em', marginTop: '4px' }}>{title}</h1>
                {subtitle && (
                    <p className="ml-4 text-gray-500 dark:text-gray-400 mt-1 leading-none" style={{ fontFamily: 'var(--font-prompt)', fontSize: '15px' }}>{subtitle}</p>
                )}
            </div>
        </div>
    );
}
