import React from 'react';

/**
 * SkeletonRows — reusable loading skeleton for list pages.
 * Renders `count` rows of pulsing grey rectangles matching a typical table/card row.
 *
 * Usage:
 *   import SkeletonRows from '@/components/ui/SkeletonRows';
 *   {isLoading && <SkeletonRows />}
 */
export default function SkeletonRows({ count = 5, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] animate-pulse"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {/* Icon placeholder */}
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex-shrink-0" />
          {/* Main content */}
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded-full bg-white/[0.07]" style={{ width: `${55 + (i % 3) * 15}%` }} />
            <div className="h-2.5 rounded-full bg-white/[0.04]" style={{ width: `${30 + (i % 4) * 10}%` }} />
          </div>
          {/* Trailing badge/amount placeholder */}
          <div className="w-16 h-6 rounded-lg bg-white/[0.05] flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}