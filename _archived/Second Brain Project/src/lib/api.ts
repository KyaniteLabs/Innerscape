// src/lib/api.ts
import 'server-only';
import { auth } from '@clerk/nextjs/server';

/**
 * @fileoverview Server-side API client for Next.js server components and actions
 * @module lib/api
 * 
 * APEX Contract:
 * - Inputs: API path and optional body
 * - Outputs: Typed response data or null
 * - Errors: Network failures logged, null returned for graceful handling
 * 
 * NOTE: This is the SERVER-SIDE version. For client components, use api-client.ts
 */

const API_BASE = process.env.LIFEOS_API_URL || 'https://api.innerscape.app/api';

export const api = {
  async get<T>(path: string): Promise<T | null> {
    const { getToken } = await auth();
    const token = await getToken();

    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error(`[APEX] Web API Error: ${res.status}`);
      return null;
    }

    const json = await res.json();
    return json.data;
  },

  async post<T>(path: string, body: unknown): Promise<T | null> {
    const { getToken } = await auth();
    const token = await getToken();

    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  },

  async patch<T>(path: string, body: unknown): Promise<T | null> {
    const { getToken } = await auth();
    const token = await getToken();

    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  },

  async delete<T>(path: string): Promise<T | null> {
    const { getToken } = await auth();
    const token = await getToken();

    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;
    
    // DELETE might return empty body
    const text = await res.text();
    if (!text) return null;
    
    const json = JSON.parse(text);
    return json.data ?? null;
  },
};
