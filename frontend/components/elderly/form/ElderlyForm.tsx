"use client";

import { useState } from "react";
import LayoutWithSidebar from "@/components/shared/LayoutWithSidebar";
import ElderlyHeader from "@/components/elderly/header/ElderlyHeader";
import { useAuth } from "@/contexts/AuthContext";
import SharedRegisterForm from "@/components/shared/form/SharedRegisterForm";

export default function ElderlyForm() {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <LayoutWithSidebar role="USERS" showSidebar={false} user={user}>
            <div className="min-h-screen bg-white">
                <ElderlyHeader user={user} locked={true} onToggleSidebar={() => setSidebarOpen(true)} />
                <SharedRegisterForm 
                    redirectPath="/elderly/verify" 
                    roleName="patient" 
                    showMobilityStatus={true} 
                    showDisease={true} 
                />
            </div>
        </LayoutWithSidebar>
    );
}
