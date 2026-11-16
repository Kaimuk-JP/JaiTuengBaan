'use client';

import { useRouter } from 'next/navigation';
import { UserSidebar } from 'gov-layout';
import { logout } from '@/lib/auth';
import Swal from '@/lib/swal';

interface RoleSidebarUser {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  pictureUrl?: string | null;
  role?: string;
}

interface RoleSidebarMenuItem {
  id: string;
  title: string;
  icon?: React.ReactNode;
  path?: string;
  children?: RoleSidebarMenuItem[];
  dividerAfter?: boolean;
}

interface RoleSidebarProps {
  user: RoleSidebarUser | null;
  roleLabel: string;
  lastName: string;
  roleColor?: string;
  menuItems: RoleSidebarMenuItem[];
  isOpen: boolean;
  onClose: () => void;
  locked?: boolean;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

export default function RoleSidebar({
  user,
  roleLabel,
  lastName,
  roleColor,
  menuItems,
  isOpen,
  onClose,
  locked = false,
  onNavigate,
  onLogout,
}: RoleSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'ออกจากระบบ',
      text: 'ต้องการออกจากระบบหรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      await logout();
      router.push('/login');
    }
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
      onClose();
    }
  };

  const items = locked
    ? []
    : menuItems.map((item) => ({
        id: item.id,
        title: item.title,
        icon: item.icon,
        path: item.path,
        children: item.children,
        dividerAfter: item.dividerAfter,
      }));

  return (
    <UserSidebar
      isOpen={isOpen}
      onClose={onClose}
      user={{
        firstName: user?.firstName || user?.displayName || '',
        lastName,
        pictureUrl: user?.pictureUrl ?? undefined,
      }}
      roleLabel={roleLabel}
      roleColor={roleColor}
      menuItems={items}
      onNavigate={handleNavigate}
      onLogout={onLogout || handleLogout}
    />
  );
}
