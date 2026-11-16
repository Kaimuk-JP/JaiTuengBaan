'use client';

import RoleHeader from '@/components/shared/RoleHeader';
import { useAuth } from '@/contexts/AuthContext';

interface CareUHeaderProps {
    user?: any;
    onToggleSidebar: () => void;
    iconColor?: string;
}

export default function CareUHeader({ user: propUser, onToggleSidebar }: CareUHeaderProps) {
    const { user: authUser } = useAuth();
    const userData = propUser || authUser;

    return (
        <RoleHeader
            user={userData}
            lastName="(จิตอาสาแคร์ยู)"
            userRole="CAREU"
            onToggleSidebar={onToggleSidebar}
        />
    );
}
