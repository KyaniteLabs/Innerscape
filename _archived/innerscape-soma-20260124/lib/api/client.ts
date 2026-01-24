import { useAuth } from '@clerk/clerk-expo';
import { ApiResponse } from '@lifeos/shared';

const API_BASE = 'https://api.innerscape.app/api';

/**
 * @fileoverview Soma API Client
 * @module lib/api/client
 * 
 * APEX Contract:
 * - Uses Clerk for auth
 * - Shared pattern with innerscape-mobile
 */

export const useApiClient = () => {
  const { getToken } = useAuth();

  const fetchWithAuth = async <T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    try {
      const token = await getToken();
      
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error(`[APEX] Soma API Error (${res.status}):`, data.error);
        return { success: false, error: data.error };
      }
      
      return { success: true, data: data.data };
    } catch (err) {
      console.error('[APEX] Soma Network/Client Error:', err);
      return { 
        success: false, 
        error: { code: 'CLIENT_ERROR', message: 'Failed to connect to server' } 
      };
    }
  };

  return {
    get: <T>(path: string) => fetchWithAuth<T>(path, { method: 'GET' }),
    post: <T>(path: string, body: any) => fetchWithAuth<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    patch: <T>(path: string, body: any) => fetchWithAuth<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: <T>(path: string) => fetchWithAuth<T>(path, { method: 'DELETE' }),
  };
};
