/**
 * @fileoverview Universal navigation shell for web
 * @module components/shell/UniversalNav
 * 
 * APEX Contract:
 * - Inputs: currentPath, user
 * - Outputs: Navigation bar with app sections
 * - Errors: Graceful handling of auth state
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { 
  LayoutDashboard, 
  Target, 
  BarChart3, 
  Brain,
  Settings,
  ChevronDown,
  Zap,
  Heart
} from 'lucide-react';
import { EmotionalContextWidget } from './EmotionalContextWidget';

const NAV_ITEMS = [
  { href: '/hub', label: 'Hub', icon: LayoutDashboard, color: '#3B82F6' },
  { href: '/flow', label: 'Flow', icon: Zap, color: '#F59E0B' },
  { href: '/body', label: 'Body', icon: Heart, color: '#EF4444' },
  { href: '/goals', label: 'Goals', icon: Target, color: '#22C55E' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, color: '#F59E0B' },
  { href: '/brain', label: 'Brain', icon: Brain, color: '#4F46E5' },
];

export function UniversalNav() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <nav className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl" />
        <span className="text-xl font-bold text-gray-900 dark:text-white">
          Innerscape
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, color }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-gray-100 dark:bg-gray-800' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <Icon 
                size={20} 
                color={isActive ? color : '#6B7280'} 
              />
              <span className={`text-sm font-medium ${
                isActive 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* User Menu + Emotional Context */}
      <div className="flex items-center gap-4">
        <EmotionalContextWidget />
        
        {user && (
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <img 
              src={user.imageUrl} 
              alt={user.firstName || 'User'} 
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user.firstName}
            </span>
            <ChevronDown size={16} color="#6B7280" />
          </button>
        )}
        <Link 
          href="/settings"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Settings size={20} color="#6B7280" />
        </Link>
      </div>
    </nav>
  );
}
