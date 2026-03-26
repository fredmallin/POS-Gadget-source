import React, { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { POSProvider } from "./contexts/POSContext";
import { usePOS } from "./contexts/POSContext";

import { LoginPage } from "./components/LoginPage";
import { DashboardLayout } from "./components/DashboardLayout";
import Dashboard from "./components/pages/Dashboard";
import SellProducts from "./components/pages/SellProducts";
import AllSales from "./components/pages/AllSales";
import { PendingOrders } from "./components/pages/PendingOrders";
import { AddProduct } from "./components/pages/AddProduct";
import { ViewProducts } from "./components/pages/ViewProducts";
import SearchProducts from "./components/pages/SearchProducts";
import LowStock from "./components/pages/LowStock";
import ChangePassword from "./components/pages/ChangePassword";
import Preferences from "./components/pages/Preferences";
import ForgotPassword from "./components/pages/ForgotPassword";
import ResetPassword from "./components/pages/ResetPassword";
import { Toaster } from "sonner";
import "./App.css";

// ================= APP CONTENT =================
const AppContent = () => {
  const { user, loading } = useAuth();
  const { sales } = usePOS();
  const [activeItem, setActiveItem] = useState("dashboard");

  // Wait for Firebase to check auth state
  if (loading) return <div style={{ 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    height: "100vh",
    fontSize: "1.2rem"
  }}>Loading...</div>;

  // Show login if not logged in
  if (!user) return <LoginPage />;

  const renderContent = () => {
    switch (activeItem) {
      case "dashboard":
        return <Dashboard key={sales.length} onNavigate={setActiveItem} />;
      case "sell":
        return <SellProducts />;
      case "all-sales":
        return <AllSales />;
      case "pending-orders":
        return <PendingOrders />;
      case "add-product":
        return <AddProduct />;
      case "view-products":
        return <ViewProducts />;
      case "search-products":
        return <SearchProducts />;
      case "low-stock":
        return <LowStock onNavigate={setActiveItem} />;
      case "change-password":
        return <ChangePassword />;
      case "preferences":
        return <Preferences />;
      default:
        return <Dashboard key={sales.length} onNavigate={setActiveItem} />;
    }
  };

  return (
    <DashboardLayout activeItem={activeItem} onMenuItemClick={setActiveItem}>
      {renderContent()}
    </DashboardLayout>
  );
};

// ================= MAIN APP =================
const App = () => (
  <AuthProvider>
    <POSProvider>
      <Toaster />
      <AppContent />
    </POSProvider>
  </AuthProvider>
);

export default App;