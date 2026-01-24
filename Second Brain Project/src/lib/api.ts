// src/lib/api.ts
import 'server-only';
import { auth } from '@clerk/nextjs/server';

const API_BASE = 'https://api.innerscape.app/api';

/**
 * APEX Contract: Next.js API Client
 * Purpose: Unified fetch with Clerk auth for Server/Client components
 */

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

  async post<T>(path: string, body: any): Promise<T | null> {
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
  }
};
