'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      const code = searchParams.get('code');

      if (!code) {
        setError('ไม่พบรหัสยืนยันจาก LINE');
        return;
      }

      try {
        const state = searchParams.get('state');
        const response = await fetch(`${getApiUrl()}/auth/line/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ code, state }),
        });

        const data = await response.json();

        if (data.success || data.user) {
          setIsRedirecting(true);

          try {
            await refreshUser();
          } catch {
          }

          await new Promise(resolve => setTimeout(resolve, 300));

          const role = data.user.role;
          const hasPhone = data.user.phone;

          if (!hasPhone) {
            if (role === 'USERS' || role === 'CAREGIVER') {
              router.replace('/elderly/verify');
            } else {
              router.replace('/select-role');
            }
          } else if (role === 'USERS') {
            router.replace('/elderly/home');
          } else if (role === 'CAREGIVER') {
            router.replace('/caregiver/home');
          } else if (role === 'DRIVE') {
            router.replace('/volunteer/home');
          } else if (role === 'STAFF' || role === 'ADMIN') {
            router.replace('/staff/dashboard');
          } else {
            router.replace('/select-role');
          }
        } else {
          setError(data.message || 'เข้าสู่ระบบล้มเหลว');
        }
      } catch (err) {
        console.error('Authentication error:', err);
        if (!isRedirecting) {
          setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        }
      }
    };

    handleCallback();
  }, [searchParams, router, refreshUser]);

  if (error && !isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full border border-red-200">
          <div className="text-red-600 text-center">
            <h2 className="text-2xl font-bold mb-4">เกิดข้อผิดพลาด</h2>
            <p className="mb-6">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">กำลังเข้าสู่ระบบ...</h2>
        <p className="text-gray-600">กรุณารอสักครู่</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">กำลังโหลด...</h2>
          <p className="text-gray-600">กรุณารอสักครู่</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
