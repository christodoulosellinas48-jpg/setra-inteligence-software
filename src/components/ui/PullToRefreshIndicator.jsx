import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function PullToRefreshIndicator({ isRefreshing, pullDistance, threshold = 70 }) {
  const visible = isRefreshing || pullDistance > 10;
  if (!visible) return null;

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-9 h-9 rounded-full bg-[#151528] border border-[#7B3BFF]/40 shadow-lg transition-opacity"
      style={{ opacity: isRefreshing ? 1 : progress }}
    >
      <RefreshCw
        className={`w-4 h-4 text-[#C084FC] ${isRefreshing ? 'animate-spin' : ''}`}
        style={{ transform: `rotate(${isRefreshing ? 0 : progress * 270}deg)` }}
      />
    </div>
  );
}