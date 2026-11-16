'use client';

import Image from 'next/image';
import { User } from '@/components/volunteer/types';
import { useTypewriter } from '@/hooks/useTypewriter';

interface StaffHeaderProps {
    user: User | null;
    variant?: 'default' | 'large';
    notificationCount?: number;
    onMenuClick?: () => void;
}

export default function StaffHeader({
    user,
    variant = 'default',
    notificationCount = 0,
    onMenuClick
}: StaffHeaderProps) {
    const isLarge = variant === 'large';
    const targetStaffName = `${user?.firstName || ''} (เจ้าหน้าที่เทศบาล)`.trim() || 'เจ้าหน้าที่เทศบาล';
    const { displayedText: typedStaffName } = useTypewriter(targetStaffName, 45, 120);

    return (
        <header className="bg-white dark:bg-gray-800 px-5 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
                {user?.pictureUrl ? (
                    <Image
                        src={user.pictureUrl}
                        alt={user.firstName || 'User'}
                        width={44}
                        height={44}
                        className="rounded-full object-cover border-2 border-cyan-100 dark:border-cyan-800"
                        unoptimized
                    />
                ) : (
                    <div className="w-11 h-11 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white text-lg font-semibold">
                            {user?.firstName?.charAt(0) || 'S'}
                        </span>
                    </div>
                )}

                {isLarge ? (
                    <h1 className="text-lg font-bold text-gray-800 dark:text-white">
                        สวัสดี, <span className="text-cyan-600 dark:text-cyan-400">{typedStaffName}</span>
                    </h1>
                ) : (
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        สวัสดี, <span className="text-cyan-600 dark:text-cyan-400">{typedStaffName}</span>
                    </p>
                )}
            </div>

            <div className="flex items-center gap-3">
                {}
                {onMenuClick && (
                    <button onClick={onMenuClick} className="p-2 text-gray-800 dark:text-white">
                        <svg width="27" height="18" viewBox="0 0 27 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.1875 17.8426C0.851042 17.8426 0.569077 17.7287 0.341604 17.501C0.113868 17.2735 0 16.9914 0 16.6547C0 16.3182 0.113868 16.0363 0.341604 15.8088C0.569077 15.5816 0.851042 15.468 1.1875 15.468H25.7292C26.0656 15.468 26.3476 15.5817 26.5751 15.8092C26.8028 16.0369 26.9167 16.3192 26.9167 16.6559C26.9167 16.9923 26.8028 17.2743 26.5751 17.5018C26.3476 17.729 26.0656 17.8426 25.7292 17.8426H1.1875ZM1.1875 10.1088C0.851042 10.1088 0.569077 9.99492 0.341604 9.76719C0.113868 9.53945 0 9.25735 0 8.9209C0 8.58417 0.113868 8.30221 0.341604 8.075C0.569077 7.84753 0.851042 7.73379 1.1875 7.73379H25.7292C26.0656 7.73379 26.3476 7.84766 26.5751 8.0754C26.8028 8.30313 26.9167 8.58523 26.9167 8.92169C26.9167 9.25841 26.8028 9.54037 26.5751 9.76758C26.3476 9.99506 26.0656 10.1088 25.7292 10.1088H1.1875ZM1.1875 2.3746C0.851042 2.3746 0.569077 2.26087 0.341604 2.0334C0.113868 1.80566 0 1.52343 0 1.18671C0 0.850249 0.113868 0.568284 0.341604 0.340812C0.569077 0.113604 0.851042 0 1.1875 0H25.7292C26.0656 0 26.3476 0.113868 26.5751 0.341604C26.8028 0.569077 26.9167 0.851174 26.9167 1.1879C26.9167 1.52435 26.8028 1.80632 26.5751 2.03379C26.3476 2.261 26.0656 2.3746 25.7292 2.3746H1.1875Z" fill="currentColor" />
                        </svg>
                    </button>
                )}
            </div>
        </header>
    );
}
