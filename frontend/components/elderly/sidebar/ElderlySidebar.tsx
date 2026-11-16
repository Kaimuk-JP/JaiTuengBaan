'use client';

import RoleSidebar from '@/components/shared/RoleSidebar';
import type { User } from '@/types/user';
import { elderlyHomeMenuItems, elderlyMenuItems, elderlyServiceMenuItems } from '../menu/menuItems';

interface ElderlySidebarProps {
    user: User | null;
    locked?: boolean;
    isOpen: boolean;
    onClose: () => void;
}

export default function ElderlySidebar({ user, locked = false, isOpen, onClose }: ElderlySidebarProps) {
    const menuItems = [
        ...elderlyHomeMenuItems,
        ...elderlyServiceMenuItems,
        ...elderlyMenuItems,
    ];

    return (
        <RoleSidebar
            user={user}
            roleLabel="ประชาชน"
            lastName="(ประชาชน)"
            menuItems={menuItems}
            isOpen={isOpen}
            onClose={onClose}
            locked={locked}
        />
    );
}
