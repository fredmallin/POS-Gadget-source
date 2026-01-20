import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import '../index.css';

export function InventoryMonitor({ products }) {
  const LOW_STOCK_THRESHOLD = 4;

  // Total inventory value safely (handles missing or string values)
  const totalValue = products.reduce(
    (sum, p) => sum + (Number(p.price || 0) * Number(p.stock || 0)),
    0
  );

  // Total stock
  const totalStock = products.reduce(
    (sum, p) => sum + Number(p.stock || 0),
    0
  );

  // Low stock products
  const lowStockProducts = products.filter(p => Number(p.stock || 0) <= LOW_STOCK_THRESHOLD);

  return (
    <div className="card shadow">
      {/* HEADER */}
      <div className="card-header">
        <h2 className="card-title">Inventory Status</h2>
      </div>

      {/* STATS */}
      <div className="card-content">
        <div className="grid grid-2 gap-4 mb-6">
          <div className="stat-box total-products">
            <p>Total Products</p>
            <p>{products.length}</p>
          </div>
          <div className="stat-box total-value">
            <p>Total Inventory Value</p>
            <p>ksh{totalValue.toFixed(2)}</p>
          </div>
        </div>

        {/* LOW STOCK ALERT */}
        {lowStockProducts.length > 0 && (
          <div className="low-stock-alert mb-4">
            <div className="alert-header">
              <AlertTriangle className="icon alert-icon" />
              <p>Low Stock Alert</p>
            </div>
            <p>
              {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} need restocking
            </p>
          </div>
        )}

        {/* PRODUCT LIST */}
        <div className="product-list">
          {products.map((product) => {
            const stock = Number(product.stock || 0);
            const price = Number(product.price || 0);
            const isLowStock = stock <= LOW_STOCK_THRESHOLD;
            const stockValue = price * stock;

            return (
              <div
                key={product.id}
                className={`product-item ${isLowStock ? 'low-stock' : ''}`}
              >
                <div className="product-info">
                  <Package className={`icon ${isLowStock ? 'alert-icon' : 'normal-icon'}`} />
                  <div>
                    <p className={isLowStock ? 'product-name alert-text' : 'product-name'}>
                      {product.name}
                    </p>
                    <p className="product-details">
                      Stock: {stock} · Value: ksh{stockValue.toFixed(2)}
                    </p>
                  </div>
                </div>
                {isLowStock && <span className="badge">Low Stock</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
