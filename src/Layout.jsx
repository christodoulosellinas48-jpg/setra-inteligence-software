import React from 'react';
import LogoLink from '@/components/ui/LogoLink';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen">
      {/* Top-left logo - only show on non-Home pages */}
      {currentPageName !== 'Home' && (
        <div className="fixed top-6 left-6 z-50">
          <LogoLink className="h-10" />
        </div>
      )}
      
      {/* Page content */}
      {children}
    </div>
  );
}