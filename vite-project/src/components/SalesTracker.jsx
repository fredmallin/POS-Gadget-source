import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import '../index.css';

export function SalesTracker({ products, onSell }) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const handleSale = (e) => {
    e.preventDefault();
    if (!selectedProductId || !quantity) return;

    const qty = parseInt(quantity);
    if (qty <= 0) return;

    onSell(selectedProductId, qty);
    setQuantity('1');
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Sales Tracker</h2>
      </div>
      <div className="card-content">
        <form onSubmit={handleSale} className="sales-form">
          <div className="form-group">
            <label>Select Product</label>
            <select
              className="input"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">Choose a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.price.toFixed(2)} (Stock: {product.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quantity</label>
            <input
              className="input"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              required
            />
          </div>

          {selectedProduct && (
            <div className="total-amount">
              <p>Total Amount</p>
              <p>${(selectedProduct.price * parseInt(quantity || '0')).toFixed(2)}</p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={!selectedProductId}
          >
            <ShoppingCart className="icon" />
            Complete Sale
          </button>
        </form>

        <div className="quick-sell">
          <h3>Quick Sell</h3>
          {products.map((product) => (
            <div key={product.id} className="quick-sell-item">
              <div className="product-info">
                <p>{product.name}</p>
                <p className="product-price">${product.price.toFixed(2)}</p>
              </div>
              <button
                className="btn btn-primary btn-small"
                onClick={() => onSell(product.id, 1)}
                disabled={product.stock === 0}
              >
                Sell 1
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
