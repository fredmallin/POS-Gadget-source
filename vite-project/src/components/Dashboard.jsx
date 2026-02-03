// Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { Outlet } from "react-router-dom";
import { ref, onValue, push, update, remove } from "firebase/database";

import { db } from "../firebase";
import Sidebar from "./Sidebar";
import { verifyAdminPassword } from "../utils/auth";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { queueOfflineAction } from "../utils/offlineQueue";
import { syncOfflineData } from "../utils/syncOfflineData";

export default function Dashboard() {
  /* =======================
     ROLE MANAGEMENT
  ======================== */
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const requestAdmin = () => setShowPassword(true);
  const switchToUser = () => setIsAdmin(false);

  const verifyPassword = () => {
    if (verifyAdminPassword(password)) {
      setIsAdmin(true);
      setShowPassword(false);
      setPassword("");
    } else {
      alert("Wrong admin password");
    }
  };

  /* =======================
     ONLINE / OFFLINE STATUS
  ======================== */
  const online = useOnlineStatus();

  useEffect(() => {
    if (online) syncOfflineData();
  }, [online]);

  /* =======================
     FIREBASE STATE
  ======================== */
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

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
     PRODUCT / SALES ACTIONS
  ======================== */
  const addProduct = (product) => {
    if (online) push(ref(db, "products"), product);
    else queueOfflineAction({ type: "ADD_PRODUCT", payload: product });
  };

  const updateProduct = (id, updates) => {
    if (online) update(ref(db, `products/${id}`), updates);
    else queueOfflineAction({ type: "UPDATE_PRODUCT", productId: id, payload: updates });
  };

  const deleteProduct = (id) => {
    if (online) remove(ref(db, `products/${id}`));
    else queueOfflineAction({ type: "DELETE_PRODUCT", productId: id });
  };

  const sellProduct = (productId, quantity) => {
    const product = products.find((p) => p.id === productId);
    if (!product || product.stock < quantity) {
      alert("Insufficient stock!");
      return;
    }

    const sale = {
      productId,
      productName: product.name,
      quantity,
      totalAmount: product.price * quantity,
      createdAt: new Date().toISOString(),
      status: "COMPLETED",
    };

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, stock: p.stock - quantity } : p
      )
    );

    setSales((prev) => [...prev, sale]);

    if (online) {
      push(ref(db, "sales"), sale);
      update(ref(db, `products/${productId}`), { stock: product.stock - quantity });
    } else {
      queueOfflineAction({ type: "SALE", payload: sale });
    }
  };

  const holdOrder = (order) => {
    const pending = { ...order, status: "PENDING", createdAt: new Date().toISOString() };
    setSales((prev) => [...prev, pending]);

    if (online) push(ref(db, "sales"), pending);
    else queueOfflineAction({ type: "SALE", payload: pending });
  };

  const completeOrder = (orderId) => {
    const order = sales.find((s) => s.id === orderId);
    if (!order) return;

    const product = products.find((p) => p.id === order.productId);
    if (!product || product.stock < order.quantity) {
      alert("Insufficient stock!");
      return;
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, stock: p.stock - order.quantity } : p
      )
    );

    setSales((prev) =>
      prev.map((s) =>
        s.id === orderId ? { ...s, status: "COMPLETED" } : s
      )
    );

    if (online) {
      update(ref(db, `products/${order.productId}`), { stock: product.stock - order.quantity });
      update(ref(db, `sales/${orderId}`), { status: "COMPLETED" });
    } else {
      queueOfflineAction({ type: "COMPLETE_ORDER", orderId });
    }
  };

  const cancelOrder = (orderId) => {
    setSales((prev) => prev.filter((s) => s.id !== orderId));

    if (online) remove(ref(db, `sales/${orderId}`));
    else queueOfflineAction({ type: "CANCEL_ORDER", orderId });
  };

  /* =======================
     RENDER
  ======================== */
  return (
    <div className="app-layout">
      <Sidebar />

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
                <Shield size={16} /> Admin
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

        {/* NESTED ROUTES */}
        <div className="dashboard-content">
          <Outlet
            context={{
              isAdmin,
              products,
              sales,
              addProduct,
              updateProduct,
              deleteProduct,
              sellProduct,
              holdOrder,
              completeOrder,
              cancelOrder,
            }}
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
    </div>
  );
}
