import React from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { CommandPaletteProvider } from '@/lib/CommandPaletteContext';
import ConsolidatedView from './pages/ConsolidatedView';
import Expenses from './pages/Expenses';
import VATAndBookkeeping from './pages/VATAndBookkeeping';
import OperationsHub from './pages/OperationsHub';
import Vendors from './pages/Vendors';
import SidebarLayout from '@/components/layout/SidebarLayout';
import Home from './pages/Home';
import Payroll from './pages/Payroll';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import AboutUs from './pages/AboutUs';
import Accountants from './pages/Accountants';
import Income from './pages/Income';
import Duplicates from './pages/Duplicates';
import Money from './pages/Money';
import FinancialData from './pages/FinancialData';
import Today from './pages/Today';
import TodayAlerts from './pages/TodayAlerts';
import Dishes from './pages/Dishes';
import Suppliers from './pages/Suppliers';
import Stock from './pages/Stock';
import Plan from './pages/Plan';
import Insights from './pages/Insights';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const navigate = useNavigate();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();
  const location = useLocation();

  const publicPaths = ['/', '/Home', '/Features', '/Pricing', '/AboutUs', '/About', '/about', '/ForAccountants', '/Accountants'];
  const isPublicPath = publicPaths.includes(location.pathname);

  // Redirect to login as a side effect, not during render
  React.useEffect(() => {
    if (!isLoadingAuth && authError?.type === 'auth_required' && !isPublicPath) {
      navigateToLogin();
    }
  }, [isLoadingAuth, authError, isPublicPath]);

  // Redirect root (/) to Today only when authenticated
  React.useEffect(() => {
    if (!isLoadingAuth && !authError && isAuthenticated && location.pathname === '/') {
      navigate('/Today', { replace: true });
    }
  }, [isLoadingAuth, authError, isAuthenticated, location.pathname, navigate]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required' && !isPublicPath) {
      return null; // useEffect above handles redirect
    }
  }

  // Render the main app
  return (
    <AnimatePresence mode="wait" initial={false}>
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.18, ease: 'easeInOut' }}
      style={{ minHeight: '100vh' }}
    >
    <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/Home" element={<Home />} />
      <Route path="/Features" element={<Features />} />
      <Route path="/Pricing" element={<Pricing />} />
      <Route path="/AboutUs" element={<AboutUs />} />
      <Route path="/About" element={<AboutUs />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/ForAccountants" element={<Accountants />} />
      <Route path="/Accountants" element={<Accountants />} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/ConsolidatedView" element={
        <LayoutWrapper currentPageName="ConsolidatedView">
          <ConsolidatedView />
        </LayoutWrapper>
      } />
      <Route path="/Vendors" element={<Navigate to="/Suppliers" replace />} />
      <Route path="/OperationsHub" element={
        <LayoutWrapper currentPageName="OperationsHub">
          <OperationsHub />
        </LayoutWrapper>
      } />
      <Route path="/VATAndBookkeeping" element={
        <LayoutWrapper currentPageName="VATAndBookkeeping">
          <VATAndBookkeeping />
        </LayoutWrapper>
      } />
      <Route path="/MenuHeatmap" element={<Navigate to="/Dishes?tab=heatmap" replace />} />
      <Route path="/Payroll" element={
        <LayoutWrapper currentPageName="Payroll">
          <Payroll />
        </LayoutWrapper>
      } />
      <Route path="/Duplicates" element={
        <LayoutWrapper currentPageName="Duplicates">
          <Duplicates />
        </LayoutWrapper>
      } />

      {/* ── Today (post-login landing) ── */}
      <Route path="/Today" element={
        isAuthenticated ? (
          <LayoutWrapper currentPageName="Today">
            <Today />
          </LayoutWrapper>
        ) : <Navigate to="/" replace />
      } />
      <Route path="/Today/alerts" element={
        isAuthenticated ? (
          <LayoutWrapper currentPageName="TodayAlerts">
            <TodayAlerts />
          </LayoutWrapper>
        ) : <Navigate to="/" replace />
      } />

      {/* ── Financial Data (canonical) ── */}
      <Route path="/FinancialData" element={
        <LayoutWrapper currentPageName="FinancialData">
          <FinancialData />
        </LayoutWrapper>
      } />

      {/* ── Merged module routes ── */}
      <Route path="/Money" element={<Navigate to="/FinancialData" replace />} />
      <Route path="/Dishes" element={
        <LayoutWrapper currentPageName="Dishes">
          <Dishes />
        </LayoutWrapper>
      } />
      <Route path="/Suppliers" element={
        <LayoutWrapper currentPageName="Suppliers">
          <Suppliers />
        </LayoutWrapper>
      } />
      <Route path="/Stock" element={
        <LayoutWrapper currentPageName="Stock">
          <Stock />
        </LayoutWrapper>
      } />
      <Route path="/Plan" element={
        <LayoutWrapper currentPageName="Plan">
          <Plan />
        </LayoutWrapper>
      } />
      <Route path="/Insights" element={
        <LayoutWrapper currentPageName="Insights">
          <Insights />
        </LayoutWrapper>
      } />

      {/* ── Legacy redirects ── */}
      <Route path="/Expenses" element={<Navigate to="/FinancialData" replace />} />
      <Route path="/Income" element={<Navigate to="/FinancialData?tab=income" replace />} />
      <Route path="/RecipeManager" element={<Navigate to="/Dishes" replace />} />
      <Route path="/MenuEngineering" element={<Navigate to="/Dishes?tab=matrix" replace />} />
      <Route path="/Vendor" element={<Navigate to="/Suppliers" replace />} />
      <Route path="/PurchaseOrders" element={<Navigate to="/Suppliers?tab=orders" replace />} />
      <Route path="/Inventory" element={<Navigate to="/Stock" replace />} />
      <Route path="/WasteManagement" element={<Navigate to="/Stock?tab=waste" replace />} />
      <Route path="/Budgeting" element={<Navigate to="/Plan" replace />} />
      <Route path="/Forecasting" element={<Navigate to="/Plan?tab=forecast" replace />} />
      <Route path="/Reports" element={<Navigate to="/Insights" replace />} />
      <Route path="/Audit" element={<Navigate to="/Insights?tab=audit" replace />} />
      <Route path="/DuplicateDetector" element={<Navigate to="/VATAndBookkeeping" replace />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </motion.div>
    </AnimatePresence>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <CommandPaletteProvider>
          <NavigationTracker />
          <AuthenticatedApp />
          </CommandPaletteProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App