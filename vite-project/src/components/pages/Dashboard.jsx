import React, { useMemo } from 'react';
import { usePOS } from "../../contexts/POSContext";
import { useAuth } from "../../contexts/AuthContext";

import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import '../../index.css';

const Dashboard = ({ onNavigate }) => {
  const { sales = [], products = [] } = usePOS();
  const { isAdmin } = useAuth();

  const today = new Date().toDateString();

  // Memoized calculations to ensure reactivity
  const todaySales = useMemo(() => {
    return sales.filter(
      (sale) => sale.status === 'Paid' && new Date(sale.date).toDateString() === today
    );
  }, [sales]);

  const todayRevenue = useMemo(() => {
    return todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  }, [todaySales]);

  const pendingOrdersCount = useMemo(() => {
    return sales.filter((sale) => sale.status === 'Pending').length;
  }, [sales]);

  const lowStockItems = useMemo(() => {
    return products.filter((p) => p.stock <= 10).length;
  }, [products]);

  const totalProducts = products.length;

  const recentSales = useMemo(() => {
    return [...sales]
      .filter((s) => s.status === 'Paid')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [sales]);

  // Stats cards
  const stats = [
    {
      title: "Today's Revenue",
      value: `$${todayRevenue.toFixed(2)}`,
      icon: <DollarSign />,
      color: 'green',
      sub: `${todaySales.length} sale(s)`,
    },
    {
      title: 'Pending Orders',
      value: pendingOrdersCount,
      icon: <Clock />,
      color: 'orange',
      action: pendingOrdersCount > 0 ? () => onNavigate('pending-orders') : null,
    },
    {
      title: 'Low Stock Items',
      value: lowStockItems,
      icon: <AlertTriangle />,
      color: 'red',
      action: lowStockItems > 0 ? () => onNavigate('low-stock') : null,
    },
    {
      title: 'Total Products',
      value: totalProducts,
      icon: <Package />,
      color: 'blue',
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your overview for today.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`stat-card ${stat.color}`}
            onClick={stat.action || undefined}
          >
            <div className="stat-info">
              <p className="stat-title">{stat.title}</p>
              <h2>{stat.value}</h2>
              {stat.sub && <span>{stat.sub}</span>}
            </div>
            <div className="stat-icon">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button onClick={() => onNavigate('sell')}>
            <ShoppingBag />
            <span>New Sale</span>
          </button>

          {isAdmin && (
            <button className="outline" onClick={() => onNavigate('add-product')}>
              <Package />
              <span>Add Product</span>
            </button>
          )}

          <button className="outline" onClick={() => onNavigate('all-sales')}>
            <TrendingUp />
            <span>View Sales</span>
          </button>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="card">
        <h3>Recent Sales</h3>

        {recentSales.length === 0 ? (
          <p className="empty">No sales yet</p>
        ) : (
          <div className="recent-sales">
            {recentSales.map((sale) => (
              <div key={sale.id} className="sale-row">
                <div>
                  <strong>{sale.items?.length || 0} item(s)</strong>
                  <p>
                    {new Date(sale.date).toLocaleString()} • {sale.userName || 'Unknown'}
                  </p>
                </div>
                <div className="sale-amount">
                  <strong>${(sale.total || 0).toFixed(2)}</strong>
                  <span>{sale.paymentMethod || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
