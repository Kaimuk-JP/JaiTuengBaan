export function isInAppBrowser(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /Line\//i.test(ua)
        || /FBAV|FBAN/i.test(ua)
        || /Instagram/i.test(ua)
        || /Twitter/i.test(ua)
        || /MicroMessenger/i.test(ua)
        || /KAKAOTALK/i.test(ua)
        || /Snapchat/i.test(ua)
        || /TikTok/i.test(ua);
}

export function getInAppBrowserName(): string | null {
    if (typeof navigator === 'undefined') return null;
    const ua = navigator.userAgent || '';
    if (/Line\//i.test(ua)) return 'LINE';
    if (/FBAV|FBAN/i.test(ua)) return 'Facebook';
    if (/Instagram/i.test(ua)) return 'Instagram';
    if (/Twitter/i.test(ua)) return 'Twitter';
    if (/MicroMessenger/i.test(ua)) return 'WeChat';
    if (/KAKAOTALK/i.test(ua)) return 'KakaoTalk';
    if (/Snapchat/i.test(ua)) return 'Snapchat';
    if (/TikTok/i.test(ua)) return 'TikTok';
    return null;
}

export function openInExternalBrowser(): void {
    const currentUrl = window.location.href;
    const ua = navigator.userAgent || '';

    if (/android/i.test(ua)) {
        const intentUrl = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
        window.location.href = intentUrl;
        return;
    }

    if (/iPhone|iPad|iPod/i.test(ua)) {
        window.open(currentUrl, '_blank');
        return;
    }

    window.open(currentUrl, '_blank');
}
