"use client";

import UnifiedProfile from '@/components/shared/profile/UnifiedProfile';
import ElderlyHeader from '@/components/elderly/header/ElderlyHeader';
import ElderlySidebar from '@/components/elderly/sidebar/ElderlySidebar';

export default function ProfileEditPage() {
    return (
        <UnifiedProfile
            startEditing
            renderHeader={({ user, onToggleSidebar }) => (
                <ElderlyHeader user={user} variant="default" onToggleSidebar={onToggleSidebar} />
            )}
            renderSidebar={({ user, isOpen, onClose }) => (
                <ElderlySidebar user={user} isOpen={isOpen} onClose={onClose} />
            )}
        />
    );
}
