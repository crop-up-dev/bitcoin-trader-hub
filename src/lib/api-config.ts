// Backend API configuration
// Change this URL to point to your Node.js backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Set to true once backend is running; false = localStorage fallback
export const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true' || false;

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; error?: string }> {
  if (!USE_BACKEND) {
    return { ok: false, error: 'Backend not enabled' };
  }

  try {
    const token = localStorage.getItem('hub-session');
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json.error || res.statusText };
    }
    return { ok: true, data: json };
  } catch (err: any) {
    console.warn(`API call failed (${endpoint}):`, err.message);
    return { ok: false, error: err.message };
  }
}
