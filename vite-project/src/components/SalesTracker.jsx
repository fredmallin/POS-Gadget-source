import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Search, Trash2 } from 'lucide-react';
import '../index.css';

export function SalesTracker({ products, onSell }) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

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

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

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
        {/* SEARCH */}
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

        {/* BODY: Products + Cart */}
        <div className="sales-tracker-body">
          {/* PRODUCT LIST */}
          <div className="product-list scrollable">
            {filteredProducts.length === 0 ? (
              <p className="empty-text">No products found</p>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="product-item">
                  <div className="product-info">
                    <p className="product-name">{product.name}</p>
                    <p className="product-details">
                      ksh{product.price.toFixed(2)} · Stock: {product.stock}
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
              ))
            )}
          </div>

          {/* CART */}
          <div className="cart scrollable">
            {cart.length === 0 ? (
              <p className="empty-text">No items in cart</p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div>
                    <p>{item.name}</p>
                    <p className="product-price">
                      ksh{item.price.toFixed(2)} × {item.quantity}
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
                  <p>ksh{totalAmount.toFixed(2)}</p>
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
    </div>
  );
}
