import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

import { AuthenticatedLayout } from "./layouts/AuthenticatedLayout";

import AuthPage from "./pages/Auth";
import DashboardPage from "./pages/Dashboard";
import OrdersPage from "./pages/Orders";
import CustomersPage from "./pages/Customers";
import AnalyticsPage from "./pages/Analytics";
import SettingsPage from "./pages/Settings";

import ChaatCategoriesPage from "./pages/ChaatCategories";
import ChaatProductsPage from "./pages/ChaatProducts";
import ChaatCombosPage from "./pages/ChaatCombos";

import JuiceCategoriesPage from "./pages/JuiceCategories";
import JuiceProductsPage from "./pages/JuiceProducts";
import JuiceCombosPage from "./pages/JuiceCombos";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            <Route path="/chaat/categories" element={<ChaatCategoriesPage />} />
            <Route path="/chaat/products" element={<ChaatProductsPage />} />
            <Route path="/chaat/combos" element={<ChaatCombosPage />} />
            
            <Route path="/juice/categories" element={<JuiceCategoriesPage />} />
            <Route path="/juice/products" element={<JuiceProductsPage />} />
            <Route path="/juice/combos" element={<JuiceCombosPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
