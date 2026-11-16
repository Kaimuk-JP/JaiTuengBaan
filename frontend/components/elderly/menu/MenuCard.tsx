'use client';

import { useRouter } from 'next/navigation';
import { MenuItem } from '../types';

interface MenuCardProps {
    item: MenuItem;
    variant?: 'primary' | 'outline';
}

export default function MenuCard({ item, variant = 'outline' }: MenuCardProps) {
    const router = useRouter();

    const isPrimary = variant === 'primary';

    return (
        <button
            onClick={() => router.push(item.path || '/')}
            className={`group w-full rounded-xl transition-all duration-300 py-2 pr-4 pl-0 flex items-center gap-4 overflow-hidden
                ${isPrimary
                    ? 'bg-brand-primary hover:bg-btn-hover text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 border-2 border-brand-primary hover:bg-brand-primary hover:border-brand-primary'
                }`}
        >
            {}
            <div className={`w-[70px] h-[60px] rounded-r-3xl flex items-center justify-center shrink-0 transition-all duration-300
                ${isPrimary
                    ? 'bg-white'
                    : 'bg-brand-primary group-hover:bg-white'
                }`}
            >
                <div className={`transition-colors duration-300 scale-150
                    ${isPrimary
                        ? 'text-brand-primary'
                        : 'text-white group-hover:text-brand-primary'
                    }`}
                >
                    {item.icon}
                </div>
            </div>

            {}
            <h2 className={`typo-body font-bold text-left transition-colors duration-300
                ${isPrimary ? 'text-white' : 'text-text-primary group-hover:text-white'}`}
            >
                {item.title}
            </h2>
        </button>
    );
}
