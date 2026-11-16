"use client";

import UnifiedProfile from '@/components/shared/profile/UnifiedProfile';
import CaregiverHeader from '@/components/caregiver/header/CaregiverHeader';
import CaregiverSidebar from '@/components/caregiver/sidebar/CaregiverSidebar';

export default function ProfileEditPage() {
    return (
        <UnifiedProfile
            startEditing
            renderHeader={({ user, onToggleSidebar }) => (
                <CaregiverHeader user={user} variant="default" onToggleSidebar={onToggleSidebar} />
            )}
            renderSidebar={({ user, isOpen, onClose }) => (
                <CaregiverSidebar user={user} isOpen={isOpen} onClose={onClose} />
            )}
        />
    );
}
