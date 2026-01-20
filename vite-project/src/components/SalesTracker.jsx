// src/components/SalesTracker.jsx
import React, { useState } from "react";
import { ShoppingCart, Plus, Minus, Search, Trash2 } from "lucide-react";
import "../index.css";

export function SalesTracker({ products = [], onSell }) {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);

  // -------------------
  // Filter products safely
  // -------------------
  const filteredProducts = products.filter(
    (p) =>
      p.name && typeof p.name === "string" && // check that name exists
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  // -------------------
  // Add product to cart
  // -------------------
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

  // -------------------
  // Update quantity
  // -------------------
  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // -------------------
  // Remove item from cart
  // -------------------
  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // -------------------
  // Calculate total
  // -------------------
  const totalAmount = cart.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

  // -------------------
  // Checkout
  // -------------------
  const handleCheckout = () => {
    cart.forEach((item) => {
      if (onSell) onSell(item.id, item.quantity);
    });
    setCart([]);
  };

  // -------------------
  // Render
  // -------------------
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
                      ksh{(product.price || 0).toFixed(2)} · Stock:{" "}
                      {product.stock || 0}
                    </p>
                  </div>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={() => addToCart(product)}
                    disabled={!product.stock}
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
                      ksh{(item.price || 0).toFixed(2)} × {item.quantity}
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
