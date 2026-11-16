'use client';

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { StaffSidebar } from 'gov-layout';
import { staffMenuItems } from '../menu/menuItems';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { logout } from '@/lib/auth';
import Swal from '@/lib/swal';
import { useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';

interface StaffLayoutProps {
    children: ReactNode;
    user?: any;
}

let cachedLogoUrl: string | null = null;

export default function StaffLayout({ children, user: propUser }: StaffLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user: authUser } = useAuth();
    const { unreadCount } = useSocket();
    const userData = propUser || authUser;
    const [collapsed, setCollapsed] = useState(false);
    const [realLogoUrl, setRealLogoUrl] = useState<string | null>(cachedLogoUrl);

    useEffect(() => {
        if (!cachedLogoUrl && userData?.organizationId) {
            fetchWithAuth('/settings/organization')
                .then(res => res.json())
                .then(data => {
                    if (data?.logoUrl) {
                        const url = `${process.env.NEXT_PUBLIC_API_URL}${data.logoUrl}`;
                        cachedLogoUrl = url;
                        setRealLogoUrl(url);
                    }
                })
                .catch(err => console.error('Failed to fetch org logo:', err));
        }
    }, [userData?.organizationId]);

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'ออกจากระบบ',
            text: 'ต้องการออกจากระบบหรือไม่?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ออกจากระบบ',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            await logout();
            router.push('/login');
        }
    };

    const getOrgLogo = (name?: string) => {
        if (!name) return '/logo.png';

        let initialName = name;
        const prefixes = ['เทศบาลตำบล', 'เทศบาลเมือง', 'เทศบาลนคร', 'เทศบาล', 'อบต.', 'องค์การบริหารส่วนตำบล'];
        for (const p of prefixes) {
            if (initialName.startsWith(p)) {
                initialName = initialName.substring(p.length).trim();
                break;
            }
        }

        const initials = initialName.substring(0, 2);

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
                <rect width="100" height="100" rx="50" fill="#1E7D55" />
                <text x="50" y="50" fill="#ffffff" font-family="Prompt, sans-serif" font-size="40" font-weight="bold" text-anchor="middle" dominant-baseline="central">
                    ${initials}
                </text>
            </svg>
        `;

        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    };

    const orgNameRaw = userData?.organization?.name || '';
    const hasMuniPrefix = ['เทศบาลตำบล', 'เทศบาลเมือง', 'เทศบาลนคร', 'เทศบาล', 'อบต.', 'องค์การบริหารส่วนตำบล'].some(p => orgNameRaw.startsWith(p));
    const orgName = orgNameRaw ? (hasMuniPrefix ? orgNameRaw : `เทศบาล${orgNameRaw}`) : "เทศบาล (ไม่มีชื่อ)";

    const provinceRaw = userData?.organization?.province || '';
    const orgSubtitle = provinceRaw ? (provinceRaw.startsWith('จังหวัด') ? provinceRaw : `จังหวัด${provinceRaw}`) : "ใจส่งถึงบ้าน";

    const dynamicMenuItems = staffMenuItems.map((item) => {
        if (item.id === 'notifications') {
            return {
                ...item,
                title: (
                    <span className="flex items-center justify-between w-full pr-1">
                        <span>การแจ้งเตือน</span>
                        {unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold text-white bg-rose-500 rounded-full min-w-5 h-5 shadow-xs">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </span>
                ) as unknown as string,
            };
        }
        return item;
    });

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <StaffSidebar
                orgLogo={realLogoUrl || (userData?.organization?.name ? getOrgLogo(userData.organization.name) : "/logo.png")}
                orgName={orgName}
                orgSubtitle={orgSubtitle}
                menuItems={dynamicMenuItems}
                bottomMenuItems={[
                    ...(authUser?.role === 'ADMIN' ? [{ id: 'back-to-portals', title: 'กลับหน้าเลือก Portal', path: '/admin/portals' }] : []),
                    { id: 'settings', title: 'ตั้งค่าระบบ', path: '/staff/settings' },
                ]}
                user={{
                    firstName: userData?.firstName || userData?.displayName || '',
                    lastName: userData?.lastName || '',
                    pictureUrl: userData?.pictureUrl,
                }}
                roleLabel={authUser?.role === 'ADMIN' ? 'ผู้ดูแลระบบสูงสุด (Admin)' : authUser?.role === 'EXECUTIVE' ? 'ผู้บริหารเทศบาล' : 'เจ้าหน้าที่เทศบาล'}
                currentPath={pathname}
                onNavigate={(path) => router.push(path)}
                onLogout={handleLogout}
                collapsible
                isOpen={!collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            <main
                className="flex-1 min-w-0 overflow-y-auto transition-all duration-300"
                style={{ marginLeft: collapsed ? 64 : 280 }}
            >
                {children}
            </main>
        </div>
    );
}
