import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight } from 'lucide-react';

function getHealthLabel(score) {
  if (score >= 80) return { label: 'Healthy', color: 'text-emerald-400', ring: 'border-emerald-500/40', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' };
  if (score >= 60) return { label: 'At Risk', color: 'text-amber-400', ring: 'border-amber-500/40', bg: 'bg-amber-500/10', dot: 'bg-amber-400' };
  return { label: 'Critical', color: 'text-rose-400', ring: 'border-rose-500/40', bg: 'bg-rose-500/10', dot: 'bg-rose-400' };
}

export default function HealthIndicator({ score = 85 }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const { label, color, ring, bg, dot } = getHealthLabel(score);

  return (
    <button
      onClick={() => navigate('/Dashboard')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border ${ring} ${bg} transition-all duration-200 ${hovered ? 'pr-4' : ''}`}
    >
      {/* Pulsing dot */}
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot} opacity-60`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`} />
      </span>

      <span className={`text-xs font-semibold ${color} transition-all duration-200`}>
        {hovered ? 'Go to Dashboard' : label}
      </span>

      {hovered && (
        <ArrowRight className={`w-3 h-3 ${color}`} />
      )}
    </button>
  );
}