import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../index.css';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  BarChart3,
  LogOut,
  Menu,
  X,
  ShoppingBag,
  Clock,
  PackagePlus,
  Search,
  PackageSearch,
  AlertTriangle,
  Lock,
  SlidersHorizontal,
} from 'lucide-react';

export const DashboardLayout = ({ children, activeItem, onMenuItemClick }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navSections = [
    {
      title: 'Main',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> }],
    },
    {
      title: 'Sales',
      items: [
        { id: 'sell', label: 'Sell Products', icon: <ShoppingCart /> },
        { id: 'all-sales', label: 'All Sold Goods', icon: <ShoppingBag /> },
        { id: 'pending-orders', label: 'Pending Orders', icon: <Clock /> },
      ],
    },
    {
      title: 'Products',
      items: [
        { id: 'add-product', label: 'Add Product', icon: <PackagePlus /> },
        { id: 'view-products', label: 'View Products', icon: <Package /> },
        { id: 'search-products', label: 'Search Products', icon: <Search /> },
      ],
    },
    {
      title: 'Stock',
      items: [
        { id: 'low-stock', label: 'Low Stock Alert', icon: <AlertTriangle /> },
      ],
    },
    {
      title: 'Settings',
      items: [
        { id: 'change-password', label: 'Change Password', icon: <Lock /> },
        { id: 'preferences', label: 'Preferences', icon: <SlidersHorizontal /> },
      ],
    },
   
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <ShoppingCart className="icon-white" />
            <span>POS System</span>
          </div>
        </div>

        <div className="sidebar-menu">
          {navSections.map((section, idx) => (
            <div key={idx} className="menu-section">
              <h4 className="section-title">{section.title}</h4>
              <nav>
                {section.items.map(item => (
                  <button
                    key={item.id}
                    className={`menu-item ${activeItem === item.id ? 'active' : ''}`}
                    onClick={() => onMenuItemClick(item.id)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <p>{user?.name}</p>
            <p className="user-role">{user?.role}</p>
          </div>
          <button className="logout-btn" onClick={logout}>
            <LogOut />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="main-header">
          <button
            className="toggle-sidebar-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X /> : <Menu />}
          </button>

          <div className="date-display">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};
