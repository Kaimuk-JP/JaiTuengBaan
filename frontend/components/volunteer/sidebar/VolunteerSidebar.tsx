'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RoleSidebar from '@/components/shared/RoleSidebar';
import { fetchWithAuth, getProfile } from '@/lib/auth';
import type { User } from '@/types/user';
import { volunteerMenuItems } from '../menu/menuItems';

interface VolunteerSidebarProps {
    user?: User | null;
    isOpen: boolean;
    onClose: () => void;
    locked?: boolean;
}

const ACTIVE_JOB_STATUSES = ['ACCEPTED', 'PICKING_UP', 'IN_TRANSIT', 'RETURN_HOME', 'RETURN_OFFICE'];

export default function VolunteerSidebar({ user, isOpen, onClose, locked }: VolunteerSidebarProps) {
    const router = useRouter();
    const [hasActiveJob, setHasActiveJob] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(user || null);

    useEffect(() => {
        const checkActiveJob = async () => {
            try {
                let userId = user?.id;
                if (!userId) {
                    const profile = await getProfile();
                    if (profile) {
                        setCurrentUser(profile);
                        userId = profile.id;
                    }
                }
                if (!userId) return;

                const response = await fetchWithAuth(`/jobs/assigned-to/${userId}`);
                if (response.ok) {
                    const jobs = await response.json();
                    const activeJob = jobs.find((job: any) =>
                        ACTIVE_JOB_STATUSES.includes(job.status)
                    );
                    setHasActiveJob(!!activeJob);
                }
            } catch (error) {
                console.error('Error checking active job:', error);
            }
        };
        checkActiveJob();
    }, [user]);

    const handleNavigate = async (path: string) => {
        const menuItem = volunteerMenuItems.find(item => item.path === path);

        if (menuItem?.id === 'map') {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                try {
                    await (DeviceOrientationEvent as any).requestPermission();
                } catch (e) {
                    console.error('Orientation request failed:', e);
                }
            }

            if (hasActiveJob) {
                router.push('/volunteer/driver?map=true');
            } else {
                router.push('/volunteer/driver');
            }
        } else {
            router.push(path);
        }
        onClose();
    };

    const displayUser = currentUser || user;

    return (
        <RoleSidebar
            user={displayUser ?? null}
            roleLabel="จิตอาสา"
            lastName="(จิตอาสา)"
            roleColor="green"
            menuItems={volunteerMenuItems}
            isOpen={isOpen}
            onClose={onClose}
            onNavigate={handleNavigate}
        />
    );
}
