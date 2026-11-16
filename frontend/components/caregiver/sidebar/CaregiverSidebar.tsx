'use client';

import RoleSidebar from '@/components/shared/RoleSidebar';
import type { User } from '@/types/user';
import { caregiverMenuItems, caregiverHomeMenuItems, caregiverServiceItems } from '../menu/menuItems';

interface CaregiverSidebarProps {
    user: User | null;
    locked?: boolean;
    isOpen: boolean;
    onClose: () => void;
}

export default function CaregiverSidebar({ user, locked = false, isOpen, onClose }: CaregiverSidebarProps) {
    const menuItems = [
        ...caregiverHomeMenuItems,
        ...caregiverServiceItems,
        ...caregiverMenuItems,
    ];

    return (
        <RoleSidebar
            user={user}
            roleLabel="ผู้ดูแลประชาชน"
            lastName="(ผู้ดูแลประชาชน)"
            roleColor="orange"
            menuItems={menuItems}
            isOpen={isOpen}
            onClose={onClose}
            locked={locked}
        />
    );
}
