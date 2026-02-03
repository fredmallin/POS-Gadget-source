import React, { useMemo } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import '../index.css';

export default function InventoryMonitor({ products }) {
  const LOW_STOCK_THRESHOLD = 4;

  // Memoized totals for performance
  const totalValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.stock || 0)), 0);
  }, [products]);

  const totalStock = useMemo(() => {
    return products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => Number(p.stock || 0) <= LOW_STOCK_THRESHOLD);
  }, [products]);

  // Sort products: low stock first
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
  }, [products]);

  // Helper: format currency
  const formatCurrency = (value) =>
    value.toLocaleString('en-KE', { style: 'currency', currency: 'KES' });

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
            <p>{formatCurrency(totalValue)}</p>
          </div>
        </div>

        {/* LOW STOCK ALERT */}
        {lowStockProducts.length > 0 && (
          <div className="low-stock-alert mb-4" aria-live="polite">
            <div className="alert-header">
              <AlertTriangle className="icon alert-icon" />
              <p>Low Stock Alert</p>
            </div>
            <p>
              {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} need restocking
            </p>
          </div>
        )}

        {/* EMPTY STATE */}
        {products.length === 0 ? (
          <p>No products in inventory.</p>
        ) : (
          <div className="product-list">
            {sortedProducts.map((product) => {
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
                        Stock: {stock} · Value: {formatCurrency(stockValue)}
                      </p>
                    </div>
                  </div>
                  {isLowStock && <span className="badge">Low Stock</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
