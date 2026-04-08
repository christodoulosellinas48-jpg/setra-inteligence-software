import React from 'react';
import { cn } from '@/lib/utils';

export default function ThemedSpinner({ className, size = 'md' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={cn(
      "rounded-full border-[#2A2A3A] border-t-[#7B3BFF] animate-spin",
      sizes[size],
      className
    )} />
  );
}