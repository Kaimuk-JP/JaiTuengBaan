'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWithSidebar from '@/components/shared/LayoutWithSidebar';
import ElderlySidebar from '../sidebar/ElderlySidebar';
import ElderlyHeader from '../header/ElderlyHeader';
import MenuCard from '../menu/MenuCard';
import { elderlyMenuItems } from '../menu/menuItems';
import { User } from '../types';
import { getCurrentUser } from '@/lib/auth';

export default function ElderlyHomeContent() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            const userData = await getCurrentUser();
            setUser(userData);
        };
        loadUser();
    }, []);

    return (
        <LayoutWithSidebar role="USERS" showSidebar={false}>
            <div className="min-h-screen bg-white dark:bg-gray-900">


                {}
                <ElderlySidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {}
                <ElderlyHeader user={user} onToggleSidebar={() => setSidebarOpen(true)} />

                {}
                <div className="container mx-auto px-3x py-3x">
                    <div className="max-w-md lg:max-w-2xl mx-auto">
                        {}
                        <div className="mb-3x">
                            <h1 className=" text-brand-primary text-center">
                                บริการหลัก
                            </h1>
                        </div>

                        {}
                        <div className="space-y-3">
                            {elderlyMenuItems.map((item, index) => (
                                <MenuCard
                                    key={item.id}
                                    item={item}
                                    variant={index === 0 ? 'primary' : 'outline'}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </LayoutWithSidebar>
    );
}
