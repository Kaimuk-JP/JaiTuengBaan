'use client';

import RoleHeader from '@/components/shared/RoleHeader';
import { User } from '../types';

interface CaregiverHeaderProps {
    user: User | null;
    variant?: 'default' | 'large';
    locked?: boolean;
    onToggleSidebar: () => void;
}

export default function CaregiverHeader({ user, variant = 'default', locked = false, onToggleSidebar }: CaregiverHeaderProps) {
    return (
        <RoleHeader
            user={user}
            lastName="(ผู้ดูแลประชาชน)"
            userRole="CAREGIVER"
            variant={variant}
            locked={locked}
            onToggleSidebar={onToggleSidebar}
            enableAutoFeedback
            enableMunicipalRating
        />
    );
}
