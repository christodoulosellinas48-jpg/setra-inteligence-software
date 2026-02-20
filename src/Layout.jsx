import React from 'react';
import LogoLink from '@/components/ui/LogoLink';

export default function Layout({ children, currentPageName }) {
  // Don't show logo on Home and Onboarding pages
  const showLogo = !['Home', 'Onboarding'].includes(currentPageName);
  
  return (
    <div className="min-h-screen">
      {/* Top-left logo */}
      {showLogo && (
        <div className="absolute top-4 left-4 z-10">
          <LogoLink className="h-8" />
        </div>
      )}
      
      {/* Page content with padding to avoid logo overlap */}
      <div className={showLogo ? "pt-16" : ""}>
        {children}
      </div>
    </div>
  );
}