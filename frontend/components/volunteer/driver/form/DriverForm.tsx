"use client";

import LayoutWithSidebar from "@/components/shared/LayoutWithSidebar";
import VolunteerSidebar from "@/components/volunteer/sidebar/VolunteerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import SharedRegisterForm from "@/components/shared/form/SharedRegisterForm";

export default function DriverForm() {
    const { user } = useAuth();

    return (
        <LayoutWithSidebar role="DRIVE" showSidebar={false}>
            <div className="min-h-screen bg-white">
                <VolunteerSidebar user={user} locked={true} isOpen={false} onClose={() => { }} />
                <SharedRegisterForm 
                    redirectPath="/volunteer/pending" 
                    roleName="volunteer" 
                    targetRole="DRIVE"
                    showMobilityStatus={false} 
                    showDisease={true} 
                />
            </div>
        </LayoutWithSidebar>
    );
}
