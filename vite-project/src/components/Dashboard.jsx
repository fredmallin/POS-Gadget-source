import { useState, useEffect } from 'react';
import { ProductManager } from './ProductManager';
import { SalesTracker } from './SalesTracker';
import { InventoryMonitor } from './InventoryMonitor';
import { ReportsAnalytics } from './ReportsAnalytics';
import { PendingSales } from "./PendingSales";

import '../index.css';

export default function Dashboard() {
  // 🔹 Load saved products & sales from localStorage, or start empty
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('sales');
    return saved ? JSON.parse(saved) : [];
  });

  // 🔹 Save products and sales to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('sales', JSON.stringify(sales));
  }, [sales]);

  const addProduct = (product) => {
    setProducts([
      ...products,
      { ...product, id: Date.now().toString() },
    ]);
  };

  const updateProduct = (id, updates) => {
    setProducts(
      products.map(p => p.id === id ? { ...p, ...updates } : p)
    );
  };

  const deleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const sellProduct = (productId, quantity) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock < quantity) {
      alert('Insufficient stock!');
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
        date: new Date(),
        paid: 0,
        balance: product.price * quantity,
        status: "PENDING"
      },
    ]);
  };

  const receivePayment = (saleId, amount) => {
    setSales(
      sales.map(sale => {
        if (sale.id === saleId) {
          const newPaid = (sale.paid || 0) + amount;
          const newBalance = sale.totalAmount - newPaid;

          return {
            ...sale,
            paid: newPaid,
            balance: newBalance,
            status: newBalance <= 0 ? "PAID" : "PARTIAL"
          };
        }
        return sale;
      })
    );
  };

  const completeOrder = (saleId) => {
    setSales(
      sales.map(sale => sale.id === saleId ? { ...sale, status: "PAID" } : sale)
    );
  };

  const cancelOrder = (saleId) => {
    setSales(sales.filter(sale => sale.id !== saleId));
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Gadget source POS Dashboard</h1>
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

      {/* 🔹 Pending Orders / Pending Sales */}
      <div className="dashboard-grid">
        <PendingSales
          products={products}
          pendingOrders={sales.filter(s => s.status !== "PAID")}
          onHoldOrder={sellProduct} // reuse your sellProduct
          onCompleteOrder={completeOrder}
          onCancelOrder={cancelOrder}
        />
      </div>
    </div>
  );
}
