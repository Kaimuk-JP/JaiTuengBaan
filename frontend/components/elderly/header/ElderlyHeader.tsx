'use client';

import RoleHeader from '@/components/shared/RoleHeader';
import { User } from '../types';

interface ElderlyHeaderProps {
    user: User | null;
    variant?: 'default' | 'large';
    locked?: boolean;
    onToggleSidebar: () => void;
}

export default function ElderlyHeader({ user, variant = 'default', locked = false, onToggleSidebar }: ElderlyHeaderProps) {
    return (
        <RoleHeader
            user={user}
            lastName="(ประชาชน)"
            userRole="USERS"
            variant={variant}
            locked={locked}
            onToggleSidebar={onToggleSidebar}
            enableAutoFeedback
            enableMunicipalRating
        />
    );
}
