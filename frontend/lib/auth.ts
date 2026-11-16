import { getApiUrl } from './api';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    let response = await fetch(`${getApiUrl()}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {

      const refreshed = await refreshToken();

      if (refreshed) {
        response = await fetch(`${getApiUrl()}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        });
      } else {
        window.location.href = '/';
        throw new Error('กรุณาเข้าสู่ระบบใหม่');
      }
    }

    return response;
  } catch (error) {
    console.error('API Error:', error);
    if (typeof window !== 'undefined' && !(error instanceof TypeError)) {
      window.location.href = '/server-error';
    }
    throw error;
  }
}

export async function getProfile() {
  const response = await fetchWithAuth('/auth/profile');
  return response.json();
}

export async function checkAuth() {
  try {
    const response = await fetch(`${getApiUrl()}/auth/profile`, {
      credentials: 'include',
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function logout() {
  try {
    await fetch(`${getApiUrl()}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  window.location.href = '/login';
}

export async function refreshToken() {
  try {
    const response = await fetch(`${getApiUrl()}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      return data.success;
    }
    return false;
  } catch (error) {
    console.error('Refresh token error:', error);
    return false;
  }
}

export async function getCurrentUser() {
  try {
    const user = await checkAuth();
    return user;
  } catch (error) {
    return null;
  }
}
