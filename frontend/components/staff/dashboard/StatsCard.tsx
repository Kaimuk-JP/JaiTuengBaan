'use client';

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color?: string;
    subtitle?: string;
    iconBgClass?: string;
    iconTextClass?: string;
    unit?: string;
}

export default function StatsCard({ title, value, icon, color, subtitle = 'จำนวน', iconBgClass, iconTextClass, unit = 'ครั้ง' }: StatsCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md flex flex-col justify-between h-[100px] sm:h-[110px] md:h-[120px]">
            <div className="flex items-start gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgClass || 'bg-green-100 dark:bg-green-900/30'} ${iconTextClass || 'text-green-700 dark:text-green-400'}`}>
                    <div className="w-4 h-4 sm:w-5 sm:h-5">
                        {icon}
                    </div>
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-medium text-slate-800 dark:text-white leading-tight pt-0.5 sm:pt-1">
                    {title}
                </h3>
            </div>

            <div className="flex items-end justify-between mt-1 sm:mt-2">
                <span className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 font-medium">{subtitle}</span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-none">
                    {value} <span className="text-base sm:text-xl font-bold">{unit}</span>
                </span>
            </div>
        </div>
    );
}
