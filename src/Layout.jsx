import React from 'react';
import LogoLink from '@/components/ui/LogoLink';

export default function Layout({ children, currentPageName }) {
  // Don't show logo on Home and Onboarding pages
  const showLogo = !['Home', 'Onboarding'].includes(currentPageName);
  
  return (
    <div className="min-h-screen">
      {/* Page content */}
      {children}
    </div>
  );
}