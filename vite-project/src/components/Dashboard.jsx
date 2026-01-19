import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { ref, onValue, push, update, remove } from "firebase/database";

import { db } from "../firebase";

import { ProductManager } from "./ProductManager";
import { SalesTracker } from "./SalesTracker";
import { InventoryMonitor } from "./InventoryMonitor";
import { ReportsAnalytics } from "./ReportsAnalytics";
import { PendingSales } from "./PendingSales";

import { verifyAdminPassword } from "../utils/auth";
import "../index.css";

export default function Dashboard() {
  /* =======================
     ROLE MANAGEMENT
  ======================== */
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const requestAdmin = () => setShowPassword(true);

  const verifyPassword = () => {
    if (verifyAdminPassword(password)) {
      setIsAdmin(true);
      setShowPassword(false);
      setPassword("");
    } else {
      alert("Wrong admin password");
    }
  };

  const switchToUser = () => setIsAdmin(false);

  /* =======================
     FIREBASE STATE
  ======================== */
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  /* =======================
     LOAD FROM FIREBASE
  ======================== */
  useEffect(() => {
    const productsRef = ref(db, "products");
    const salesRef = ref(db, "sales");

    onValue(productsRef, (snap) => {
      const data = snap.val();
      setProducts(
        data ? Object.entries(data).map(([id, v]) => ({ id, ...v })) : []
      );
    });

    onValue(salesRef, (snap) => {
      const data = snap.val();
      setSales(
        data ? Object.entries(data).map(([id, v]) => ({ id, ...v })) : []
      );
    });
  }, []);

  /* =======================
     PRODUCT MANAGEMENT
  ======================== */
  const addProduct = (product) => {
    push(ref(db, "products"), product);
  };

  const updateProduct = (id, updates) => {
    update(ref(db, `products/${id}`), updates);
  };

  const deleteProduct = (id) => {
    remove(ref(db, `products/${id}`));
  };

  /* =======================
     SELL PRODUCT
  ======================== */
  const sellProduct = (productId, quantity) => {
    const product = products.find((p) => p.id === productId);
    if (!product || product.stock < quantity) {
      alert("Insufficient stock!");
      return;
    }

    update(ref(db, `products/${productId}`), {
      stock: product.stock - quantity,
    });

    push(ref(db, "sales"), {
      productId,
      productName: product.name,
      quantity,
      totalAmount: product.price * quantity,
      createdAt: new Date().toISOString(),
      status: "COMPLETED",
    });
  };

  /* =======================
     HOLD PENDING ORDER
  ======================== */
  const holdOrder = (order) => {
    push(ref(db, "sales"), {
      ...order,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    });
  };

  /* =======================
     COMPLETE PENDING ORDER
  ======================== */
  const completeOrder = (orderId) => {
    const order = sales.find((s) => s.id === orderId);
    if (!order) return;

    const product = products.find((p) => p.id === order.productId);
    if (!product || product.stock < order.quantity) {
      alert("Insufficient stock!");
      return;
    }

    update(ref(db, `products/${order.productId}`), {
      stock: product.stock - order.quantity,
    });

    update(ref(db, `sales/${orderId}`), {
      status: "COMPLETED",
    });
  };

  /* =======================
     CANCEL PENDING ORDER
  ======================== */
  const cancelOrder = (orderId) => {
    remove(ref(db, `sales/${orderId}`));
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

        <SalesTracker products={products} onSell={sellProduct} />
      </div>

      {/* ADMIN ONLY */}
      {isAdmin && (
        <div className="dashboard-grid">
          <InventoryMonitor products={products} />
          <ReportsAnalytics products={products} sales={sales} />
        </div>
      )}

      {/* SHARED */}
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
