import React from 'react';
import SidebarLayout from '@/components/layout/SidebarLayout';

export default function Layout({ children, currentPageName }) {
  // Don't show sidebar on Home and Onboarding pages
  const showSidebar = !['Home', 'Onboarding'].includes(currentPageName);
  
  return showSidebar ? (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  ) : (
    <div className="min-h-screen">
      {children}
    </div>
  );
}