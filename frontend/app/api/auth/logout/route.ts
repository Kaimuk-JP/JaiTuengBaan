import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.GOV_API_URL || 'http://localhost:3001';

    const backendRes = await fetch(`${apiUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      credentials: 'include',
    });

    const response = NextResponse.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ',
    });

    response.cookies.delete('session_user');

    return response;

  } catch (error) {
    console.error('Logout API Error:', error);
    const response = NextResponse.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ',
    });
    response.cookies.delete('session_user');
    return response;
  }
}
