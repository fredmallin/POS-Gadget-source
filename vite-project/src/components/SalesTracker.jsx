// src/components/SalesTracker.jsx
import React, { useState } from "react";
import { ShoppingCart, Plus, Minus, Search, Trash2 } from "lucide-react";
import "../index.css";
import { productsRef, salesRef, db } from "../firebase";
import { update, push, child, get } from "firebase/database";

export default function SalesTracker({ products = [] }) {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);

  // ------------------- Filter products safely -------------------
  const filteredProducts = products.filter(
    (p) =>
      p.name &&
      typeof p.name === "string" &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ------------------- Add product to cart -------------------
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const stock = product.stock || 0;

      if (existing) {
        // Do not exceed stock
        if (existing.quantity >= stock) return prev;
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      if (stock <= 0) return prev;
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // ------------------- Update quantity -------------------
  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          const newQuantity = item.quantity + delta;
          const stock = item.stock || 0;
          return {
            ...item,
            quantity: Math.max(0, Math.min(newQuantity, stock)),
          };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // ------------------- Remove item from cart -------------------
  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // ------------------- Calculate total -------------------
  const totalAmount = cart.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

  // ------------------- Checkout -------------------
  const handleCheckout = async () => {
    for (const item of cart) {
      const productRef = child(productsRef, item.id);

      // Get the latest stock from Firebase
      const snapshot = await get(productRef);
      const currentStock = snapshot.val()?.stock || 0;

      if (currentStock < item.quantity) {
        alert(
          `Cannot sell ${item.quantity} of ${item.name}. Only ${currentStock} left!`
        );
        continue;
      }

      // Reduce stock
      const newStock = currentStock - item.quantity;
      await update(productRef, { stock: newStock });

      // Log sale
      await push(salesRef, {
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        date: Date.now(),
      });
    }

    setCart([]);
    alert("Sale completed!");
  };

  // ------------------- Render -------------------
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
              filteredProducts.map((product) => {
                const cartItem = cart.find((c) => c.id === product.id);
                const remainingStock =
                  product.stock - (cartItem?.quantity || 0);

                return (
                  <div key={product.id} className="product-item">
                    <div className="product-info">
                      <p className="product-name">{product.name}</p>
                      <p className="product-details">
                        ksh{(product.price || 0).toFixed(2)} · Stock:{" "}
                        {remainingStock}
                      </p>
                    </div>
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => addToCart(product)}
                      disabled={remainingStock <= 0}
                    >
                      <Plus className="icon" /> Add
                    </button>
                  </div>
                );
              })
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
                      disabled={item.quantity >= item.stock}
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
