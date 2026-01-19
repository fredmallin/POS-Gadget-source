import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import '../index.css';

export function InventoryMonitor({ products }) {
  const LOW_STOCK_THRESHOLD = 4;

  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStockProducts = products.filter(p => p.stock <= LOW_STOCK_THRESHOLD);

  return (
    <div className="card shadow">
      <div className="card-header">
        <h2 className="card-title">Inventory Status</h2>
      </div>
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

        {lowStockProducts.length > 0 && (
          <div className="low-stock-alert mb-4">
            <div className="alert-header">
              <AlertTriangle className="icon alert-icon" />
              <p>Low Stock Alert</p>
            </div>
            <p>{lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} need restocking</p>
          </div>
        )}

        <div className="product-list">
          {products.map((product) => {
            const isLowStock = product.stock <= LOW_STOCK_THRESHOLD;
            const stockValue = product.price * product.stock;

            return (
              <div key={product.id} className={`product-item ksh{isLowStock ? 'low-stock' : ''}`}>
                <div className="product-info">
                  <Package className={`icon ksh{isLowStock ? 'alert-icon' : 'normal-icon'}`} />
                  <div>
                    <p className={isLowStock ? 'product-name alert-text' : 'product-name'}>{product.name}</p>
                    <p className="product-details">
                      Stock: {product.stock} · Value: ksh{stockValue.toFixed(2)}
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
