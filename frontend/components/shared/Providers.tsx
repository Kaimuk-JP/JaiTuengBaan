'use client';

import React, { useEffect, useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import GlobalPrivacyConsentModal from '@/components/shared/GlobalPrivacyConsentModal';
import GlobalLineConnectPrompt from '@/components/shared/GlobalLineConnectPrompt';

interface ProvidersProps {
    children: React.ReactNode;
}

function LazySettingsProvider({ children }: { children: React.ReactNode }) {
    const [Provider, setProvider] = useState<React.ComponentType<{ children: React.ReactNode }> | null>(null);

    useEffect(() => {
        import('gov-layout').then(mod => {
            setProvider(() => mod.SettingsProvider);
        });
    }, []);

    if (!Provider) return <>{children}</>;
    return <Provider>{children}</Provider>;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <AuthProvider>
            <SocketProvider>
                <LazySettingsProvider>
                    {children}
                    <GlobalPrivacyConsentModal />
                    <GlobalLineConnectPrompt />
                </LazySettingsProvider>
            </SocketProvider>
        </AuthProvider>
    );
};
