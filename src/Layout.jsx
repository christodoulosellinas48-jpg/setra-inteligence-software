import React from 'react';
import AppHeader from '@/components/ui/AppHeader';

export default function Layout({ children, currentPageName }) {
  // Don't show header on Home and Onboarding pages
  const showHeader = !['Home', 'Onboarding'].includes(currentPageName);
  
  return (
    <div className="min-h-screen">
      {/* Premium header with logo and navigation */}
      {showHeader && <AppHeader />}
      
      {/* Page content with padding to avoid header overlap */}
      <div className={showHeader ? "pt-14" : ""}>
        {children}
      </div>
    </div>
  );
}