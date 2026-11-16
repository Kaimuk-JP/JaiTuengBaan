import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session_user')?.value;

    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie);
        return NextResponse.json({
          success: true,
          user: sessionData,
        });
      } catch {
        const response = NextResponse.json(
          { success: false, message: 'Session ไม่ถูกต้อง' },
          { status: 401 }
        );
        response.cookies.delete('session_user');
        return response;
      }
    }

    const apiUrl = process.env.GOV_API_URL || 'http://localhost:3001';

    const backendRes = await fetch(`${apiUrl}/auth/profile`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      credentials: 'include',
    });

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ session กรุณาเข้าสู่ระบบใหม่' },
        { status: 401 }
      );
    }

    const userData = await backendRes.json();

    return NextResponse.json({
      success: true,
      user: userData,
    });

  } catch (error) {
    console.error('Session API Error:', error);
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถอ่าน session ได้' },
      { status: 500 }
    );
  }
}
