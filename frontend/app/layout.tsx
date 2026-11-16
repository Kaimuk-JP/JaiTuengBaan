import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";
import Script from "next/script";

const notoSansThai = Noto_Sans_Thai({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["thai"],
  variable: "--font-noto-thai",
  display: 'swap',
});

const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ใจส่งถึงบ้าน | เทศบาลนครสุขภิรมย์",
  applicationName: "ใจส่งถึงบ้าน",
  description: "ใจส่งถึงบ้าน (JaiSongTuengBaan) บริการรับ-ส่งโดยจิตอาสา",
  appleWebApp: { title: "ใจส่งถึงบ้าน" },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <script
          id="app-init-script"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              // === Dark mode init ===
              try {
                var theme = localStorage.getItem('app-theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}

              // === Universal In-App Browser Viewport Fix ===
              (function() {
                var ua = navigator.userAgent || '';
                var isInApp = /Line\\//i.test(ua) ||
                              /FBAV/i.test(ua) || /FBAN/i.test(ua) ||
                              /Instagram/i.test(ua) || /Twitter/i.test(ua) ||
                              /MicroMessenger/i.test(ua) ||
                              /\\bwv\\b/.test(ua);

                var vp = 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
                var meta = document.querySelector('meta[name="viewport"]');
                if (meta) {
                  meta.setAttribute('content', vp);
                } else {
                  meta = document.createElement('meta');
                  meta.name = 'viewport';
                  meta.content = vp;
                  document.head.appendChild(meta);
                }

                function setVH() {
                  var vh = window.innerHeight * 0.01;
                  document.documentElement.style.setProperty('--app-vh', vh + 'px');
                }
                setVH();
                window.addEventListener('resize', setVH);
                window.addEventListener('orientationchange', function() {
                  setTimeout(setVH, 150);
                });

                if (isInApp) {
                  document.documentElement.classList.add('in-app-browser');
                  if (/Line\\//i.test(ua)) document.documentElement.classList.add('line-browser');

                  document.addEventListener('DOMContentLoaded', function() {
                    document.body.style.display = 'none';
                    document.body.offsetHeight;
                    document.body.style.display = '';
                  });
                }
              })();

              // === Gesture Prevention ===
              document.addEventListener('gesturestart', function (e) {
                e.preventDefault();
              });
              document.addEventListener('gesturechange', function (e) {
                e.preventDefault();
              });
              document.addEventListener('gestureend', function (e) {
                e.preventDefault();
              });
              document.addEventListener('dblclick', function(event) {
                event.preventDefault();
              }, { passive: false });

              var lastTouchEnd = 0;
              document.addEventListener('touchend', function (event) {
                var now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                  event.preventDefault();
                }
                lastTouchEnd = now;
              }, false);
            `,
          }}
        />
      </head>
      <body
        className={`${notoSansThai.variable} ${inter.variable} font-sans antialiased bg-white dark:bg-gray-900 dark:text-gray-100`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
