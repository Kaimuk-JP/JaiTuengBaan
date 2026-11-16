'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { logout } from '@/lib/auth';

function DebugPageContent() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const syncData = async () => {
    try {
      await refreshUser();
      alert(` Sync สำเร็จ!\nRole: ${user?.role}`);
    } catch (error) {
      console.error('Sync error:', error);
      alert('เจ้าหน้าที่ขับรถSync ล้มเหลว');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  const debugInfo = {
    isAuthenticated: !!user,
    user: user,
    timestamp: new Date().toLocaleString('th-TH'),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            Debug Information (Protected)
          </h1>

          <div className="space-y-6">
            {}
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h2 className="font-bold text-lg mb-2 text-blue-800">Authentication Status</h2>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Status: </span>
                  {debugInfo.isAuthenticated ? (
                    <span className="text-green-600"> Authenticated (Cookie-based)</span>
                  ) : (
                    <span className="text-red-600">เจ้าหน้าที่ขับรถNot Authenticated</span>
                  )}
                </div>
              </div>
            </div>

            {}
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
              <h2 className="font-bold text-lg mb-2 text-green-800">User Information</h2>
              {debugInfo.user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {debugInfo.user.pictureUrl && (
                      <img
                        src={debugInfo.user.pictureUrl}
                        alt="Profile"
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <div className="font-bold text-lg">{debugInfo.user.displayName}</div>
                      <div className="text-sm text-gray-600">ID: {debugInfo.user.id}</div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded space-y-1">
                    <div>
                      <span className="font-semibold">Role: </span>
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-800">
                        {debugInfo.user.role}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-red-600">เจ้าหน้าที่ขับรถไม่พบข้อมูล User</div>
              )}
            </div>

            {}
            {debugInfo.user && (
              <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                <h2 className="font-bold text-lg mb-2 text-yellow-800">Expected Redirect</h2>
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Current Role: </span>
                    <span className="font-bold">{debugInfo.user.role}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Should redirect to: </span>
                    <code className="bg-white px-2 py-1 rounded font-bold">
                      {debugInfo.user.role === 'USERS' && '/elderly'}
                      {debugInfo.user.role === 'DRIVE' && '/volunteer/driver'}
                      {debugInfo.user.role === 'STAFF' && '/staff'}
                    </code>
                  </div>
                </div>
              </div>
            )}

            {}
            <div className="text-sm text-gray-500 text-center">
              อัปเดตล่าสุด: {debugInfo.timestamp}
            </div>
          </div>

          {}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/')}
              className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              🏠 หน้าแรก
            </button>
            <button
              onClick={syncData}
              className="bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              🔄 Refresh User
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              ♻️ Reload Page
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              🗑️ Logout
            </button>
          </div>

          {}
          {debugInfo.user && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/elderly')}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 rounded-lg font-semibold transition-colors"
              >
                👴 ไปหน้า Elderly
              </button>
              <button
                onClick={() => router.push('/volunteer/driver')}
                className="bg-green-100 hover:bg-green-200 text-green-800 py-2 rounded-lg font-semibold transition-colors"
              >
                ไปหน้า Driver
              </button>
              <button
                onClick={() => router.push('/staff')}
                className="bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 rounded-lg font-semibold transition-colors"
              >
                👨‍💼 ไปหน้า Staff
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DebugPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DebugPageContent />
    </ProtectedRoute>
  );
}
