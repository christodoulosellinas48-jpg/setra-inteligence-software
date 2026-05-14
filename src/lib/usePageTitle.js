import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/': 'Home',
  '/Home': 'Home',
  '/Dashboard': 'Dashboard',
  '/OperationsHub': 'Operations Hub',
  '/Expenses': 'Expenses',
  '/VATAndBookkeeping': 'VAT & Bookkeeping',
  '/Budgeting': 'Budget',
  '/Forecasting': 'Forecasting',
  '/Reports': 'Reports',
  '/Audit': 'Audit',
  '/MenuEngineering': 'Menu Engineering',
  '/Vendors': 'Vendors & Suppliers',
  '/Inventory': 'Inventory',
  '/Payroll': 'Payroll',
  '/RecipeManager': 'Recipe Manager',
  '/WasteManagement': 'Waste Management',
  '/PurchaseOrders': 'Purchase Orders',
  '/Integrations': 'Setra Connect',
  '/Settings': 'Settings',
  '/ConsolidatedView': 'Consolidated View',
  '/CreateBusiness': 'Create Business',
  '/Onboarding': 'Onboarding',
  '/Invitations': 'Invitations',
  '/Features': 'Features',
  '/Pricing': 'Pricing',
  '/AboutUs': 'About Us',
};

const APP_NAME = 'Setra — Intelligence Platform';

export default function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    const label = PAGE_TITLES[location.pathname];
    document.title = label ? `${label} | ${APP_NAME}` : APP_NAME;
  }, [location.pathname]);
}