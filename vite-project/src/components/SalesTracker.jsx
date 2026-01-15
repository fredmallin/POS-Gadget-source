import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Search, Trash2 } from 'lucide-react';
import '../index.css';

export function SalesTracker({ products, onSell }) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ➕ Add product to cart
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // ➕➖ Change quantity
  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // ❌ Remove item
  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // 💰 Total
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ✅ Complete sale
  const handleCheckout = () => {
    cart.forEach((item) => {
      onSell(item.id, item.quantity);
    });
    setCart([]);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Sales Tracker</h2>
      </div>

      <div className="card-content">
        {/* 🔍 SEARCH */}
        <div className="form-group">
          <label>Search Products</label>
          <div className="search-input">
            <Search className="icon" />
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product..."
            />
          </div>
        </div>

        {/* 📦 PRODUCT LIST */}
        <div className="quick-sell">
          <h3>Products</h3>
          {filteredProducts.map((product) => (
            <div key={product.id} className="quick-sell-item">
              <div>
                <p>{product.name}</p>
                <p className="product-price">
                  ${product.price.toFixed(2)} (Stock: {product.stock})
                </p>
              </div>
              <button
                className="btn btn-primary btn-small"
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
              >
                <Plus className="icon" /> Add
              </button>
            </div>
          ))}
        </div>

        {/* 🛒 CART */}
        <div className="cart">
          <h3>Cart</h3>

          {cart.length === 0 ? (
            <p className="empty-text">No items in cart</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div>
                  <p>{item.name}</p>
                  <p className="product-price">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>

                <div className="cart-actions">
                  <button
                    className="btn btn-outline btn-small"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus />
                  </button>
                  <button
                    className="btn btn-outline btn-small"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus />
                  </button>
                  <button
                    className="btn btn-outline btn-small btn-danger"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))
          )}

          {cart.length > 0 && (
            <>
              <div className="total-amount">
                <p>Total</p>
                <p>${totalAmount.toFixed(2)}</p>
              </div>

              <button
                className="btn btn-primary w-full"
                onClick={handleCheckout}
              >
                <ShoppingCart className="icon" />
                Complete Sale
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
