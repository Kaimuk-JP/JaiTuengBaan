"use client";

import LayoutWithSidebar from "@/components/shared/LayoutWithSidebar";
import { CaregiverSidebar } from "@/components/caregiver/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import SharedRegisterForm from "@/components/shared/form/SharedRegisterForm";

export default function CaregiverForm() {
    const { user } = useAuth();

    return (
        <LayoutWithSidebar role="CAREGIVER" showSidebar={false}>
            <div className="min-h-screen bg-white">
                <CaregiverSidebar user={user} locked={true} isOpen={false} onClose={() => { }} />
                <SharedRegisterForm 
                    redirectPath="/caregiver/home" 
                    roleName="caregiver" 
                    showMobilityStatus={false} 
                    showDisease={true} 
                />
            </div>
        </LayoutWithSidebar>
    );
}
