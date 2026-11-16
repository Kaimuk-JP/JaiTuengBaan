import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'ใจส่งถึงบ้าน | เทศบาลนครสุขภิรมย์',
        short_name: 'ใจส่งถึงบ้าน',
        description: 'ใจส่งถึงบ้าน (JaiSongTuengBaan) บริการรับ-ส่งโดยจิตอาสา',
        id: '/',
        start_url: '/',
        scope: '/',
        lang: 'th',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2E7D55',
        icons: [
            { src: '/Assets/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/Assets/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/Assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/Assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
