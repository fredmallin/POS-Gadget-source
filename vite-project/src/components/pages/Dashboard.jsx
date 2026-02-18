import React, { useState, useMemo } from "react";
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
  const { sales, pendingOrders, products, clearSales, user, token } = usePOS();

  // ----------------------------
  // State for "re-enter password"
  // ----------------------------
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ----------------------------
  // Re-login handler (verify password)
  // ----------------------------
  const handleRelogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/relogin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // use same token from login
        },
        body: JSON.stringify({ password }) // send the password to verify
      });

      const data = await res.json();

      if (res.ok) {
        setAuthenticated(true);
        setError("");
      } else {
        setError(data.error || "Incorrect password");
      }
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  };

  // ----------------------------
  // Dashboard calculations (hooks at top level)
  // ----------------------------
  const today = new Date().toDateString();

  const todaySales = useMemo(() =>
    sales.filter(s => s.status === "Paid" && new Date(s.date).toDateString() === today),
    [sales]
  );

  const todayRevenue = useMemo(() =>
    todaySales.reduce((sum, s) => sum + (s.total || 0), 0),
    [todaySales]
  );

  const totalRevenue = useMemo(() =>
    sales.filter(s => s.status === "Paid").reduce((sum, s) => sum + (s.total || 0), 0),
    [sales]
  );

  const totalStockValue = useMemo(() =>
    products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0),
    [products]
  );

  const pendingOrdersCount = pendingOrders.length;
  const lowStockItems = products.filter(p => p.stock <= 10).length;
  const totalProducts = products.length;

  const recentSales = useMemo(
    () => [...sales].filter(s => s.status === "Paid")
      .sort((a,b) => new Date(b.date) - new Date(a.date))
      .slice(0,5),
    [sales]
  );

  const stats = [
    { title: "Today's Revenue", value: `$${todayRevenue.toFixed(2)}`, icon: <DollarSign />, color:'green', sub:`${todaySales.length} sale(s)` },
    { title: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon:<TrendingUp />, color:'blue' },
    { title:"Total Stock Value", value:`$${totalStockValue.toFixed(2)}`, icon:<Layers />, color:'purple' },
    { title:"Pending Orders", value: pendingOrdersCount, icon:<Clock />, color:'orange', action: pendingOrdersCount>0?()=>onNavigate('pending-orders'):null },
    { title:"Low Stock Items", value: lowStockItems, icon:<AlertTriangle />, color:'red', action: lowStockItems>0?()=>onNavigate('low-stock'):null },
    { title:"Total Products", value: totalProducts, icon:<Package />, color:'teal' }
  ];

  const handleClear = async () => {
    if(window.confirm("This will permanently delete all sales. Continue?")){
      await clearSales();
      alert("Sales cleared!");
    }
  }

  const formatItems = items => items.map(i => `${i.productName||'Item'} (${i.quantity||1})`).join(', ');

  // ----------------------------
  // Render password first
  // ----------------------------
  if (!authenticated) {
    return (
      <div className="dashboard-login">
        <h2>Enter your password to continue</h2>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleRelogin}>Submit</button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  // ----------------------------
  // Render dashboard
  // ----------------------------
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user.username || "Guest"}!</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat,i)=>(
          <div key={i} className={`stat-card ${stat.color}`} onClick={stat.action||undefined} style={{cursor:stat.action?'pointer':'default'}}>
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
          <button onClick={()=>onNavigate('sell')}><ShoppingBag /><span>New Sale</span></button>
          <button className="outline" onClick={()=>onNavigate('add-product')}><Package /><span>Add Product</span></button>
          <button className="outline" onClick={()=>onNavigate('all-sales')}><TrendingUp /><span>View Sales</span></button>
          <button className="danger" onClick={handleClear}><Trash2 /><span>Clear Sales</span></button>
        </div>
      </div>

      <div className="card">
        <h3>Recent Sales</h3>
        {recentSales.length===0?<p className="empty">No sales yet</p>:(
          <div className="recent-sales">
            {recentSales.map(sale=>(
              <div key={sale.id} className="sale-row">
                <div>
                  <strong>{formatItems(sale.items)}</strong>
                  <p>{sale.userName || 'Unknown'} • {new Date(sale.date).toLocaleTimeString()}</p>
                </div>
                <div className="sale-amount">
                  <strong>${(sale.total||0).toFixed(2)}</strong>
                  <span>{sale.paymentMethod||'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
