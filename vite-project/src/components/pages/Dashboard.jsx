import React, { useState, useMemo, useEffect } from "react";
import { usePOS } from "../../contexts/POSContext";
import '../../index.css';
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  Trash2,
  Layers
} from 'lucide-react';

const Dashboard = ({ onNavigate }) => {
  const { 
    sales, 
    pendingOrders, 
    products, 
    clearSales, 
    user, 
    token, 
    unlockDashboard 
  } = usePOS();

  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Redirect to login if no token
  useEffect(() => {
    if (!token) {
      onNavigate("login");
    }
  }, [token, onNavigate]);

  // 🔐 Dashboard Unlock
  const handleUnlock = async () => {
    if (!password) {
      setError("Please enter your dashboard password");
      return;
    }

    const result = await unlockDashboard(password);

    if (result.success) {
      setAuthenticated(true);
      setError("");
    } else {
      setError(result.error || "Incorrect dashboard password");
    }
  };

  // ---------------- Stats ----------------
  const today = new Date().toDateString();

  const todaySales = useMemo(
    () =>
      sales.filter(
        s =>
          s.status === "Paid" &&
          new Date(s.date).toDateString() === today
      ),
    [sales]
  );

  const todayRevenue = useMemo(
    () => todaySales.reduce((sum, s) => sum + (s.total || 0), 0),
    [todaySales]
  );

  const totalRevenue = useMemo(
    () =>
      sales
        .filter(s => s.status === "Paid")
        .reduce((sum, s) => sum + (s.total || 0), 0),
    [sales]
  );

  const totalStockValue = useMemo(
    () =>
      products.reduce(
        (sum, p) => sum + (p.price || 0) * (p.stock || 0),
        0
      ),
    [products]
  );

  const pendingOrdersCount = pendingOrders.length;
  const lowStockItems = products.filter(p => p.stock <= 10).length;
  const totalProducts = products.length;

  const recentSales = useMemo(
    () =>
      [...sales]
        .filter(s => s.status === "Paid")
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5),
    [sales]
  );

  const stats = [
    {
      title: "Today's Revenue",
      value: `$${todayRevenue.toFixed(2)}`,
      icon: <DollarSign />,
      color: "green",
      sub: `${todaySales.length} sale(s)`
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: <TrendingUp />,
      color: "blue"
    },
    {
      title: "Total Stock Value",
      value: `$${totalStockValue.toFixed(2)}`,
      icon: <Layers />,
      color: "purple"
    },
    {
      title: "Pending Orders",
      value: pendingOrdersCount,
      icon: <Clock />,
      color: "orange",
      action:
        pendingOrdersCount > 0
          ? () => onNavigate("pending-orders")
          : null
    },
    {
      title: "Low Stock Items",
      value: lowStockItems,
      icon: <AlertTriangle />,
      color: "red",
      action:
        lowStockItems > 0
          ? () => onNavigate("low-stock")
          : null
    },
    {
      title: "Total Products",
      value: totalProducts,
      icon: <Package />,
      color: "teal"
    }
  ];

  const handleClear = async () => {
    if (window.confirm("This will permanently delete all sales. Continue?")) {
      await clearSales();
      alert("Sales cleared!");
    }
  };

  const formatItems = items =>
    items
      .map(i => `${i.productName || "Item"} (${i.quantity || 1})`)
      .join(", ");

  // ---------------- DASHBOARD LOCK SCREEN ----------------
  if (!authenticated) {
    return (
      <div className="dashboard-login">
        <h2>Enter Dashboard Password</h2>
        <input
          type="password"
          placeholder="Dashboard password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button onClick={handleUnlock}>Unlock</button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  // ---------------- DASHBOARD ----------------
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.username || "User"}!</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`stat-card ${stat.color}`}
            onClick={stat.action || undefined}
            style={{ cursor: stat.action ? "pointer" : "default" }}
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

      <div className="card">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button onClick={() => onNavigate("sell")}>
            <ShoppingBag />
            <span>New Sale</span>
          </button>

          <button
            className="outline"
            onClick={() => onNavigate("add-product")}
          >
            <Package />
            <span>Add Product</span>
          </button>

          <button
            className="outline"
            onClick={() => onNavigate("all-sales")}
          >
            <TrendingUp />
            <span>View Sales</span>
          </button>

          <button className="danger" onClick={handleClear}>
            <Trash2 />
            <span>Clear Sales</span>
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Recent Sales</h3>
        {recentSales.length === 0 ? (
          <p className="empty">No sales yet</p>
        ) : (
          <div className="recent-sales">
            {recentSales.map(sale => (
              <div key={sale.id} className="sale-row">
                <div>
                  <strong>{formatItems(sale.items)}</strong>
                  <p>
                    {sale.userName || "Unknown"} •{" "}
                    {new Date(sale.date).toLocaleTimeString()}
                  </p>
                </div>

                <div className="sale-amount">
                  <strong>
                    ${(sale.total || 0).toFixed(2)}
                  </strong>
                  <span>{sale.paymentMethod || "N/A"}</span>
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