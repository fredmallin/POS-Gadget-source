import React, { useState } from 'react';
import { LayoutDashboard, ShoppingCart, ShoppingBag, Clock, PackagePlus, Package, Search, Warehouse, AlertTriangle, Lock, SlidersHorizontal, BarChart3, LogOut, Menu, X, PackageSearch } from 'lucide-react';
import './DashboardLayout.css';

export const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('dashboard');

  const user = { name: 'John Doe', role: 'admin' };
  const isAdmin = true;

  const navSections = [
    {
      title: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
      ],
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
        { id: 'add-product', label: 'Add Product', icon: <PackagePlus />, adminOnly: true },
        { id: 'view-products', label: 'View Products', icon: <Package /> },
        { id: 'search-products', label: 'Search Products', icon: <Search /> },
      ],
    },
    {
      title: 'Stock',
      items: [
        { id: 'all-stock', label: 'All Stock', icon: <Warehouse /> },
        { id: 'low-stock', label: 'Low Stock Alert', icon: <AlertTriangle /> },
      ],
    },
    {
      title: 'Settings',
      items: [
        { id: 'change-password', label: 'Change Password', icon: <Lock /> },
        { id: 'preferences', label: 'Preferences', icon: <SlidersHorizontal />, adminOnly: true },
      ],
    },
    {
      title: 'Admin',
      items: [
        { id: 'total-goods', label: 'Total Goods', icon: <PackageSearch />, adminOnly: true },
        { id: 'total-sales', label: 'Total Sales', icon: <BarChart3 />, adminOnly: true },
        { id: 'stock-value', label: 'Stock Value', icon: <BarChart3 />, adminOnly: true },
      ],
    },
  ];

  const filteredSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.adminOnly || isAdmin),
    }))
    .filter(section => section.items.length > 0);

  const handleLogout = () => alert('Logout clicked');

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <ShoppingCart className="logo-icon" />
            <span>POS System</span>
          </div>
        </div>

        <div className="sidebar-nav">
          {filteredSections.map((section, idx) => (
            <div key={idx} className="nav-section">
              <h3>{section.title}</h3>
              <nav>
                {section.items.map(item => (
                  <button
                    key={item.id}
                    className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
                    onClick={() => setActiveItem(item.id)}
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
            <p>{user.name}</p>
            <p>{user.role}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <header>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X /> : <Menu />}
          </button>
          <div className="date">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
};
