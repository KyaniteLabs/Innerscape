import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://api.innerscape.app/api'; // Replace with your production URL

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export const useApiClient = () => {
  const fetchWithAuth = async <T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error(`[APEX] API Error (${res.status}):`, data.error);
        return { success: false, error: data.error };
      }
      
      return { success: true, data: data.data };
    } catch (err) {
      console.error('[APEX] Network/Client Error:', err);
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
