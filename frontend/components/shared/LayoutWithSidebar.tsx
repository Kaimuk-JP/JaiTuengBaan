'use client';

import { ReactNode, useState } from 'react';
import ElderlySidebar from '../elderly/sidebar/ElderlySidebar';
import { User } from '../elderly/types';

interface LayoutWithSidebarProps {
  children: ReactNode;
  role?: 'USERS' | 'DRIVE' | 'CAREU' | 'STAFF' | 'ADMIN' | 'CAREGIVER';
  showSidebar?: boolean;
  user?: User | null;
}

export default function LayoutWithSidebar({
  children,
  role,
  showSidebar = true,
  user = null
}: LayoutWithSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <ElderlySidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
