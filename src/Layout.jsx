import React from 'react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { BusinessProvider } from '@/components/business/BusinessContext';

export default function Layout({ children, currentPageName }) {
  // Don't show sidebar on Home and Onboarding pages
  const showSidebar = !['Home', 'Onboarding'].includes(currentPageName);
  
  return showSidebar ? (
    <BusinessProvider>
      <SidebarLayout>
        {children}
      </SidebarLayout>
    </BusinessProvider>
  ) : (
    <div className="min-h-screen">
      {children}
    </div>
  );
}