/**
 * @fileoverview Client-side API wrapper for browser components
 * @module lib/api-client
 * 
 * APEX Contract:
 * - Inputs: API path and optional body
 * - Outputs: Typed response data or null
 * - Errors: Network failures logged, null returned for graceful handling
 * 
 * NOTE: This is the CLIENT-SIDE version. For server components, use api.ts
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.innerscape.app/api';

/**
 * Client-side API client for use in "use client" components.
 * Uses fetch with credentials for cookie-based auth.
 */
export const apiClient = {
  async get<T>(path: string): Promise<T | null> {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        console.error(`[APEX] Client API Error: ${res.status}`);
        return null;
      }

      const json = await res.json();
      return json.data ?? json;
    } catch (err) {
      console.error('[APEX] Client API Network Error:', err);
      return null;
    }
  },

  async post<T>(path: string, body: unknown): Promise<T | null> {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error(`[APEX] Client API Error: ${res.status}`);
        return null;
      }

      const json = await res.json();
      return json.data ?? json;
    } catch (err) {
      console.error('[APEX] Client API Network Error:', err);
      return null;
    }
  },

  async patch<T>(path: string, body: unknown): Promise<T | null> {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error(`[APEX] Client API Error: ${res.status}`);
        return null;
      }

      const json = await res.json();
      return json.data ?? json;
    } catch (err) {
      console.error('[APEX] Client API Network Error:', err);
      return null;
    }
  },

  async delete<T>(path: string): Promise<T | null> {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        console.error(`[APEX] Client API Error: ${res.status}`);
        return null;
      }

      const json = await res.json();
      return json.data ?? json;
    } catch (err) {
      console.error('[APEX] Client API Network Error:', err);
      return null;
    }
  },
};
