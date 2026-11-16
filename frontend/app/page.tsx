'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;

    const error = searchParams.get('error');

    if (error) {
      hasRedirected.current = true;
      router.replace('/login');
      return;
    }

    if (loading) return;

    hasRedirected.current = true;

    if (user) {
      switch (user.role) {
        case 'USERS':
          router.replace(user.phone ? '/elderly/home' : '/select-role');
          break;
        case 'CAREGIVER':
          router.replace(user.phone ? '/caregiver/home' : '/select-role');
          break;
        case 'DRIVE':
          router.replace('/volunteer/driver');
          break;
        case 'CAREU':
          router.replace('/volunteer/careu');
          break;
        case 'STAFF':
        case 'ADMIN':
          router.replace('/staff/dashboard');
          break;
        default:
          router.replace('/select-role');
      }
    } else {
      router.replace('/login');
    }
  }, [searchParams, router, user, loading]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-xl font-medium text-gray-800">กำลังโหลด...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-xl font-medium text-gray-800">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
