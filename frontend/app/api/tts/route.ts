import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_TRANSLATE_TTS_URL = 'https://translate.google.com/translate_tts';

export async function GET(request: NextRequest) {
    const text = request.nextUrl.searchParams.get('text')?.trim() || '';

    if (!text) {
        return NextResponse.json({ message: 'Missing text' }, { status: 400 });
    }

    try {
        const upstreamUrl = new URL(GOOGLE_TRANSLATE_TTS_URL);
        upstreamUrl.searchParams.set('ie', 'UTF-8');
        upstreamUrl.searchParams.set('tl', 'th');
        upstreamUrl.searchParams.set('client', 'tw-ob');
        upstreamUrl.searchParams.set('q', text);

        const upstreamRes = await fetch(upstreamUrl.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://translate.google.com/',
            },
            cache: 'no-store',
        });

        if (!upstreamRes.ok || !upstreamRes.body) {
            const details = await upstreamRes.text().catch(() => '');
            return NextResponse.json(
                {
                    message: 'Google Translate TTS request failed',
                    status: upstreamRes.status,
                    details,
                },
                { status: upstreamRes.status || 502 },
            );
        }

        return new NextResponse(upstreamRes.body, {
            status: 200,
            headers: {
                'Content-Type': upstreamRes.headers.get('content-type') || 'audio/mpeg',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    } catch (error) {
        console.error('TTS proxy error:', error);
        return NextResponse.json({ message: 'TTS proxy error' }, { status: 500 });
    }
}
