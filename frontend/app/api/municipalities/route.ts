import { NextRequest, NextResponse } from 'next/server';

const MUNICIPALITIES_ENDPOINT = 'https://api-auth.govcenter.co/master-data/municipalities/search';

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')?.trim() || '';

  if (!name) {
    return NextResponse.json([]);
  }

  try {
    const upstreamUrl = `${MUNICIPALITIES_ENDPOINT}?name=${encodeURIComponent(name)}`;
    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text();
      return NextResponse.json(
        {
          message: 'Upstream request failed',
          status: upstreamRes.status,
          details: errorText,
        },
        { status: upstreamRes.status }
      );
    }

    const data = await upstreamRes.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Municipalities proxy error:', error);
    return NextResponse.json(
      { message: 'Municipalities proxy error' },
      { status: 500 }
    );
  }
}
