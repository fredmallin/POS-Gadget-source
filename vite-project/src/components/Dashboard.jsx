import { useState, useEffect } from 'react';
import { ProductManager } from './ProductManager';
import { SalesTracker } from './SalesTracker';
import { InventoryMonitor } from './InventoryMonitor';
import { ReportsAnalytics } from './ReportsAnalytics';
import { PendingSales } from "./PendingSales";

import '../index.css';

export default function Dashboard() {
  // 🔹 Load saved products & sales from localStorage
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('sales');
    return saved ? JSON.parse(saved) : [];
  });

  // 🔹 Persist data
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('sales', JSON.stringify(sales));
  }, [sales]);

  // 🔹 Product management
  const addProduct = (product) => {
    setProducts([...products, { ...product, id: Date.now().toString() }]);
  };

  const updateProduct = (id, updates) => {
    setProducts(
      products.map(p => p.id === id ? { ...p, ...updates } : p)
    );
  };

  const deleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // 🔹 Direct sale (reduces stock immediately)
  const sellProduct = (productId, quantity) => {
    const product = products.find(p => p.id === productId);
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
        createdAt: new Date(),
        paid: 0,
        balance: product.price * quantity,
        status: "PAID"
      }
    ]);
  };

  // 🔹 Hold pending order (NO stock change)
  const holdOrder = (order) => {
    setSales([...sales, order]);
  };

  // 🔹 Complete pending order (reduce stock)
  const completeOrder = (orderId) => {
    const order = sales.find(s => s.id === orderId);
    if (!order) return;

    const product = products.find(p => p.id === order.productId);
    if (!product) return;

    if (product.stock < order.quantity) {
      alert("Insufficient stock!");
      return;
    }

    updateProduct(order.productId, {
      stock: product.stock - order.quantity
    });

    setSales(
      sales.map(s =>
        s.id === orderId ? { ...s, status: "PAID" } : s
      )
    );
  };

  // 🔹 Cancel pending order
  const cancelOrder = (orderId) => {
    setSales(sales.filter(s => s.id !== orderId));
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Gadget Source POS Dashboard</h1>
        <p>Manage your products, track sales, and monitor inventory</p>
      </header>

      <div className="dashboard-grid">
        <ProductManager
          products={products}
          addProduct={addProduct}
          updateProduct={updateProduct}
          deleteProduct={deleteProduct}
        />

        <SalesTracker
          products={products}
          onSell={sellProduct}
        />
      </div>

      <div className="dashboard-grid">
        <InventoryMonitor products={products} />
        <ReportsAnalytics products={products} sales={sales} />
      </div>

      {/* 🔹 Pending Orders */}
      <div className="dashboard-grid">
        <PendingSales
          products={products}
          pendingOrders={sales.filter(s => s.status !== "PAID")}
          onHoldOrder={holdOrder}
          onCompleteOrder={completeOrder}
          onCancelOrder={cancelOrder}
        />
      </div>
    </div>
  );
}
