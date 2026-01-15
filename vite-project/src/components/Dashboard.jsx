import { useState, useEffect } from "react";
import { Shield } from "lucide-react";

import { ProductManager } from "./ProductManager";
import { SalesTracker } from "./SalesTracker";
import { InventoryMonitor } from "./InventoryMonitor";
import { ReportsAnalytics } from "./ReportsAnalytics";
import { PendingSales } from "./PendingSales";

import { verifyAdminPassword } from "../utils/auth"; // ✅ Import verify function

import "../index.css";

export default function Dashboard() {
  /* =======================
     ROLE MANAGEMENT
  ======================== */
  const [isAdmin, setIsAdmin] = useState(false); // User by default
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const requestAdmin = () => {
    setShowPassword(true);
  };

  const verifyPassword = () => {
    if (verifyAdminPassword(password)) { // ✅ Use bcrypt check
      setIsAdmin(true);
      setShowPassword(false);
      setPassword("");
    } else {
      alert("Wrong admin password");
    }
  };

  const switchToUser = () => {
    setIsAdmin(false);
  };

  /* =======================
     LOAD FROM LOCAL STORAGE
  ======================== */
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem("products");
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem("sales");
    return saved ? JSON.parse(saved) : [];
  });

  /* =======================
     PERSIST TO LOCAL STORAGE
  ======================== */
  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("sales", JSON.stringify(sales));
  }, [sales]);

  /* =======================
     PRODUCT MANAGEMENT
  ======================== */
  const addProduct = (product) => {
    setProducts([...products, { ...product, id: Date.now().toString() }]);
  };

  const updateProduct = (id, updates) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  /* =======================
     DIRECT SALE (COMPLETED)
  ======================== */
  const sellProduct = (productId, quantity) => {
    const product = products.find((p) => p.id === productId);
    if (!product || product.stock < quantity) {
      alert("Insufficient stock!");
      return;
    }

    updateProduct(productId, { stock: product.stock - quantity });

    setSales([
      ...sales,
      {
        id: Date.now().toString(),
        productId,
        productName: product.name,
        quantity,
        totalAmount: product.price * quantity,
        createdAt: new Date().toISOString(),
        status: "COMPLETED",
      },
    ]);
  };

  /* =======================
     HOLD PENDING ORDER
  ======================== */
  const holdOrder = (order) => {
    setSales([
      ...sales,
      { ...order, id: Date.now().toString(), createdAt: new Date().toISOString(), status: "PENDING" },
    ]);
  };

  /* =======================
     COMPLETE PENDING ORDER
  ======================== */
  const completeOrder = (orderId) => {
    const order = sales.find((s) => s.id === orderId);
    if (!order) return;

    const product = products.find((p) => p.id === order.productId);
    if (!product) return;

    if (product.stock < order.quantity) {
      alert("Insufficient stock!");
      return;
    }

    updateProduct(order.productId, { stock: product.stock - order.quantity });

    setSales(sales.map((s) => (s.id === orderId ? { ...s, status: "COMPLETED" } : s)));
  };

  /* =======================
     CANCEL PENDING ORDER
  ======================== */
  const cancelOrder = (orderId) => {
    setSales(sales.filter((s) => s.id !== orderId));
  };

  /* =======================
     RENDER
  ======================== */
  return (
    <div className="dashboard">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Gadget Source POS Dashboard</h1>
          <p className="dashboard-subtitle">
            Manage your products, track sales, and monitor inventory
          </p>
        </div>

        <div className="dashboard-actions">
          {isAdmin && (
            <span className="admin-badge">
              <Shield size={16} />
              Admin
            </span>
          )}

          {isAdmin ? (
            <button className="role-btn" onClick={switchToUser}>
              Switch to User
            </button>
          ) : (
            <button className="role-btn" onClick={requestAdmin}>
              Switch to Admin
            </button>
          )}
        </div>
      </div>

      {/* USER + ADMIN SECTIONS */}
      <div className="dashboard-grid">
        <ProductManager
          products={products}
          addProduct={addProduct}
          updateProduct={updateProduct}
          deleteProduct={deleteProduct}
        />

        <SalesTracker products={products} onSell={sellProduct} onHold={holdOrder} />
      </div>

      {/* ADMIN-ONLY SECTIONS */}
      {isAdmin && (
        <div className="dashboard-grid">
          <InventoryMonitor products={products} />
          <ReportsAnalytics products={products} sales={sales} />
        </div>
      )}

      {/* SHARED SECTION */}
      <div className="dashboard-grid">
        <PendingSales
          products={products}
          pendingOrders={sales.filter((s) => s.status === "PENDING")}
          onHoldOrder={holdOrder}
          onCompleteOrder={completeOrder}
          onCancelOrder={cancelOrder}
        />
      </div>

      {/* PASSWORD MODAL */}
      {showPassword && (
        <div className="password-overlay">
          <div className="password-modal">
            <h3>Admin Access</h3>

            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="password-actions">
              <button onClick={verifyPassword}>Login</button>
              <button onClick={() => setShowPassword(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
