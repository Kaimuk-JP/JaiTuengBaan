'use client';

import RoleHeader from '@/components/shared/RoleHeader';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderVolunteerProps {
    user?: any;
    onToggleSidebar: () => void;
}

export default function HeaderVolunteer({ user: propUser, onToggleSidebar }: HeaderVolunteerProps) {
    const { user: authUser } = useAuth();
    const userData = propUser || authUser;

    return (
        <RoleHeader
            user={userData}
            lastName="(เจ้าหน้าที่ขับรถ)"
            userRole="DRIVE"
            onToggleSidebar={onToggleSidebar}
        />
    );
}
