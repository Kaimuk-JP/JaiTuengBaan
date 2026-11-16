'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { getLineConnectionStatus } from '@/lib/lineService';
import LineConnectModal from './LineConnectModal';

export default function GlobalLineConnectPrompt() {
    const { user, loading, refreshUser } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [orgName, setOrgName] = useState<string | null>(null);
    const [botBasicId, setBotBasicId] = useState<string | null>(null);
    const [customLiffId, setCustomLiffId] = useState<string | null>(null);
    const [orgId, setOrgId] = useState<string | null>(null);

    const isBypassRoute =
        !pathname ||
        pathname === '/login' ||
        pathname === '/' ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/register') ||
        pathname === '/select-role' ||
        pathname === '/server-error';

    useEffect(() => {
        if (loading || !user || isBypassRoute) {
            setIsOpen(false);
            return;
        }

        if (user.lineUserId) {
            setIsOpen(false);
            return;
        }

        if (!user.privacyAcceptedAt) {
            setIsOpen(false);
            return;
        }

        const dismissedUntil = localStorage.getItem('volunteer_smart_line_modal_dismissed_until');
        if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
            setIsOpen(false);
            return;
        }

        const sessionDismissed = sessionStorage.getItem('volunteer_smart_line_session_dismissed');
        if (sessionDismissed === 'true') {
            setIsOpen(false);
            return;
        }

        let isCancelled = false;

        const checkAndShowModal = async () => {
            try {
                const status = await getLineConnectionStatus();
                if (status.lineNotificationEnabled === false) {
                    return;
                }
                setOrgName(status.organizationName || null);
                setBotBasicId(status.lineBotBasicId || null);
                setCustomLiffId(status.customLiffId || null);
                setOrgId(status.organizationId || (user as any).organizationId || null);
            } catch {
            }

            if (!isCancelled) {
                setIsOpen(true);
            }
        };

        const timer = setTimeout(() => {
            checkAndShowModal();
        }, 1200);

        return () => {
            isCancelled = true;
            clearTimeout(timer);
        };
    }, [user, loading, pathname, isBypassRoute]);

    if (!isOpen || !user || user.lineUserId) return null;

    const handleClose = () => {
        sessionStorage.setItem('volunteer_smart_line_session_dismissed', 'true');
        setIsOpen(false);
    };

    const handleSuccess = async () => {
        setIsOpen(false);
        await refreshUser();
    };

    let benefits = {
        title1: 'แจ้งเตือนคำขออนุมัติ & คิวรถใหม่',
        title2: 'เตือนเวลานัดหมาย & เวลารถรับ-ส่ง',
        title3: 'อัปเดตสถานะและข้อมูลสำคัญ Real-time',
    };

    if (user.role === 'DRIVE' || user.role === 'CAREU') {
        benefits = {
            title1: 'แจ้งเตือนคำขออนุมัติ & งานใหม่',
            title2: 'เตือนเวลาเข้า-ออกงาน & การปฏิบัติภารกิจ',
            title3: 'สถิติ Streak & แต้มสะสม Real-time',
        };
    } else if (user.role === 'CAREGIVER') {
        benefits = {
            title1: 'แจ้งเตือนคำขออนุมัติ & คิวรถของผู้ป่วย',
            title2: 'เตือนเวลานัดหมายโรงพยาบาล & เวลารถมารับ',
            title3: 'อัปเดตสถานะการเดินทาง Real-time',
        };
    } else if (user.role === 'STAFF' || user.role === 'ADMIN') {
        benefits = {
            title1: 'แจ้งเตือนคำขออนุมัติคิวรถและภารกิจใหม่',
            title2: 'รายงานสรุปประจำวัน & ข้อความเร่งด่วน',
            title3: 'ติดตามสถานะงานจิตอาสา Real-time',
        };
    }

    const displayName = orgName ? `LINE ${orgName}` : 'ใจส่งถึงบ้าน';

    return (
        <LineConnectModal
            isOpen={isOpen}
            onClose={handleClose}
            onSuccess={handleSuccess}
            stepText="ขั้นตอนแนะนำ"
            systemName={displayName}
            orgId={orgId || undefined}
            customLiffId={customLiffId || undefined}
            botBasicId={botBasicId || undefined}
            customBenefits={benefits}
        />
    );
}
