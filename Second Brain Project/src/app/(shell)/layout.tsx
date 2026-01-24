/**
 * @fileoverview Shell layout with universal navigation
 * @module app/(shell)/layout
 */

import React from 'react';
import { UniversalNav } from '@/components/shell/UniversalNav';

export const dynamic = 'force-dynamic';

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <UniversalNav />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
