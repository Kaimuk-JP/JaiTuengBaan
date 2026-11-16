'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserSidebar } from 'gov-layout';
import { logout, getProfile } from '@/lib/auth';
import type { User } from '@/types/user';
import { careuMenuItems } from '../menu/menuItems';
import Swal from '@/lib/swal';

interface CareUSidebarProps {
    user?: User | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function CareUSidebar({ user, isOpen, onClose }: CareUSidebarProps) {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(user || null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                if (!user?.id) {
                    const profile = await getProfile();
                    if (profile) {
                        setCurrentUser(profile);
                    }
                }
            } catch (error) {
                console.error('Error fetching user for sidebar:', error);
            }
        };
        fetchUser();
    }, [user]);

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'ออกจากระบบ',
            text: 'ต้องการออกจากระบบหรือไม่?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ออกจากระบบ',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            await logout();
            router.push('/login');
        }
    };

    const handleNavigate = (path: string) => {
        router.push(path);
        onClose();
    };

    const displayUser = currentUser || user;

    return (
        <UserSidebar
            isOpen={isOpen}
            onClose={onClose}
            user={{
                firstName: displayUser?.firstName || displayUser?.displayName || '',
                lastName: 'จิตอาสาแคร์ยู',
                pictureUrl: displayUser?.pictureUrl ?? undefined,
            }}
            roleLabel="จิตอาสาแคร์ยู"
            roleColor="green"
            menuItems={careuMenuItems}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
        />
    );
}
