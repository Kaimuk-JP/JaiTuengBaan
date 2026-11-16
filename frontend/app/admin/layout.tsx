'use client';

import { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { StaffSidebar } from 'gov-layout';
import { adminMenuItems } from '@/components/admin/menu/adminMenuItems';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/auth';
import Swal from '@/lib/swal';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/auth';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user: authUser } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [realLogoUrl, setRealLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        if (authUser?.organizationId) {
            fetchWithAuth('/settings/organization')
                .then(res => res.json())
                .then(data => {
                    if (data?.logoUrl) {
                        setRealLogoUrl(`${process.env.NEXT_PUBLIC_API_URL}${data.logoUrl}`);
                    }
                })
                .catch(err => console.error('Failed to fetch org logo:', err));
        }
    }, [authUser?.organizationId]);

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

    const orgName = authUser?.organization?.name || "เทศบาล (ไม่มีชื่อ)";

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <StaffSidebar
                orgLogo={realLogoUrl || (authUser?.organization?.name ? getOrgLogo(authUser.organization.name) : "/logo.png")}
                orgName={orgName}
                orgSubtitle="ใจส่งถึงบ้าน"
                menuItems={adminMenuItems}
                bottomMenuItems={[
                    { id: 'back-to-portals', title: 'หน้าเลือก Portal', path: '/admin/portals' },
                    { id: 'back-to-dashboard', title: 'กลับ Dashboard', path: '/staff/dashboard' },
                ]}
                user={{
                    firstName: authUser?.firstName || authUser?.displayName || '',
                    lastName: authUser?.lastName || '',
                    pictureUrl: authUser?.pictureUrl ?? undefined,
                }}
                roleLabel={authUser?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}
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
