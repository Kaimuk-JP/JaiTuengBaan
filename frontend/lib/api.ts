export function getApiUrl(): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
        throw new Error('การตั้งค่าระบบไม่สมบูรณ์ กรุณาติดต่อผู้ดูแลระบบ');
    }

    return apiUrl;
}

export function getApiEndpoint(endpoint: string): string {
    const baseUrl = getApiUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
}
