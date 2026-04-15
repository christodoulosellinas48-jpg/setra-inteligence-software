import Audit from './pages/Audit';
import Budgeting from './pages/Budgeting';
import ConsolidatedView from './pages/ConsolidatedView';
import CreateBusiness from './pages/CreateBusiness';
import Dashboard from './pages/Dashboard';
import Features from './pages/Features';
import Forecasting from './pages/Forecasting';
import Home from './pages/Home';
import Integrations from './pages/Integrations';
import Invitations from './pages/Invitations';
import Onboarding from './pages/Onboarding';
import Pricing from './pages/Pricing';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AboutUs from './pages/AboutUs';
import Inventory from './pages/Inventory';
import Payroll from './pages/Payroll';
import RecipeManager from './pages/RecipeManager';
import PurchaseOrders from './pages/PurchaseOrders';
import MenuEngineering from './pages/MenuEngineering';
import WasteManagement from './pages/WasteManagement';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Audit": Audit,
    "Budgeting": Budgeting,
    "ConsolidatedView": ConsolidatedView,
    "CreateBusiness": CreateBusiness,
    "Dashboard": Dashboard,
    "Features": Features,
    "Forecasting": Forecasting,
    "Home": Home,
    "Integrations": Integrations,
    "Invitations": Invitations,
    "Onboarding": Onboarding,
    "Pricing": Pricing,
    "Reports": Reports,
    "Settings": Settings,
    "AboutUs": AboutUs,
    "Inventory": Inventory,
    "Payroll": Payroll,
    "RecipeManager": RecipeManager,
    "PurchaseOrders": PurchaseOrders,
    "MenuEngineering": MenuEngineering,
    "WasteManagement": WasteManagement,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};