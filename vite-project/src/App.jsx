import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { POSProvider, usePOS } from './contexts/POSContext';

import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import Dashboard from './components/pages/Dashboard';

import SellProducts from './components/pages/SellProducts';
import AllSales from './components/pages/AllSales';
import { PendingOrders } from './components/pages/PendingOrders';
import { AddProduct } from './components/pages/AddProduct';
import { ViewProducts } from './components/pages/ViewProducts';
import SearchProducts from './components/pages/SearchProducts';

import { AllStock } from './components/pages/AllStock';
import LowStock from './components/pages/LowStock';

import ChangePassword from './components/pages/ChangePassword';
import Preferences from './components/pages/Preferences';
import { AdminReports } from './components/pages/AdminReports';

import { Toaster } from 'sonner';
import './App.css';

const AppContent = () => {
  const { user } = useAuth();
  const { sales } = usePOS(); // <- important: track sales
  const [activeItem, setActiveItem] = useState('dashboard');

  if (!user) return <LoginPage />;

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        // force remount when sales change
        return <Dashboard key={sales.length} onNavigate={setActiveItem} />;
      case 'sell':
        return <SellProducts />;
      case 'all-sales':
        return <AllSales />;
      case 'pending-orders':
        return <PendingOrders />;
      case 'add-product':
        return <AddProduct />;
      case 'view-products':
        return <ViewProducts />;
      case 'search-products':
        return <SearchProducts />;
      case 'all-stock':
        return <AllStock />;
      case 'low-stock':
        return <LowStock onNavigate={setActiveItem} />;
      case 'change-password':
        return <ChangePassword />;
      case 'preferences':
        return <Preferences />;
      case 'total-goods':
        return <AdminReports reportType="total-goods" />;
      case 'total-sales':
        return <AdminReports reportType="total-sales" />;
      case 'stock-value':
        return <AdminReports reportType="stock-value" />;
      default:
        return <Dashboard key={sales.length} onNavigate={setActiveItem} />;
    }
  };

  return (
    <DashboardLayout
      activeItem={activeItem}
      onMenuItemClick={setActiveItem}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

const App = () => (
  <AuthProvider>
    <POSProvider>
      <AppContent />
      <Toaster />
    </POSProvider>
  </AuthProvider>
);

export default App;
