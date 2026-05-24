import React from 'react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { BusinessProvider, useBusiness } from '@/components/business/BusinessContext';
import { SidebarLayoutProvider } from '@/lib/SidebarLayoutContext';

function SidebarWithLayout({ children }) {
  const { currentBusiness, groups, businesses, userRole } = useBusiness();
  return (
    <SidebarLayoutProvider
      currentBusiness={currentBusiness}
      groups={groups}
      businesses={businesses}
      userRole={userRole}
    >
      <SidebarLayout>
        {children}
      </SidebarLayout>
    </SidebarLayoutProvider>
  );
}

export default function Layout({ children, currentPageName }) {
  const showSidebar = !['Home', 'Onboarding'].includes(currentPageName);

  return showSidebar ? (
    <BusinessProvider>
      <SidebarWithLayout>
        {children}
      </SidebarWithLayout>
    </BusinessProvider>
  ) : (
    <div className="min-h-screen">
      {children}
    </div>
  );
}