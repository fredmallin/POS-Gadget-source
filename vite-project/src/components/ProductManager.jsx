// src/components/ProductManager.jsx
import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import "../index.css";
import { db, productsRef, salesRef } from "../firebase"; // make sure salesRef is exported from firebase.js
import { onValue, push, update, remove, child } from "firebase/database";

export function ProductManager() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  // -------------------
  // Fetch products from Firebase
  // -------------------
  useEffect(() => {
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val() || {}; // fallback if offline
      const productsArray = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      setProducts(productsArray);
    });

    return () => unsubscribe();
  }, []);

  // -------------------
  // Add a new product
  // -------------------
  const addProduct = (productData) => {
    push(productsRef, productData);
  };

  // -------------------
  // Update an existing product
  // -------------------
  const updateProduct = (id, productData) => {
    const productRef = child(productsRef, id);
    update(productRef, productData);
  };

  // -------------------
  // Delete a product
  // -------------------
  const deleteProduct = (id) => {
    const productRef = child(productsRef, id);
    remove(productRef);
  };

  // -------------------
  // Sell a product
  // -------------------
  const handleSell = (product) => {
    if (product.stock <= 0) return; // can't sell if out of stock

    const newStock = product.stock - 1;

    // Update local state immediately
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
    );

    // Update Firebase
    const productRef = child(productsRef, product.id);
    update(productRef, { stock: newStock });

    // Record sale in /sales
    if (salesRef) {
      push(salesRef, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        date: Date.now(),
      });
    }
  };

  // -------------------
  // Handle form submit
  // -------------------
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !price || !stock) return;

    const productData = {
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
    };

    if (editingId) {
      updateProduct(editingId, productData);
      setEditingId(null);
    } else {
      addProduct(productData);
    }

    setName("");
    setPrice("");
    setStock("");
  };

  // -------------------
  // Handle editing
  // -------------------
  const handleEdit = (product) => {
    setEditingId(product.id);
    setName(product.name || "");
    setPrice(product.price !== undefined ? product.price.toString() : "");
    setStock(product.stock !== undefined ? product.stock.toString() : "");
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setStock("");
  };

  // -------------------
  // Filter products safely
  // -------------------
  const filteredProducts = products.filter(
    (product) =>
      product.name &&
      typeof product.name === "string" &&
      product.name.toLowerCase().includes(search.toLowerCase())
  );

  // -------------------
  // Render UI
  // -------------------
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Product Management</h2>
      </div>

      <div className="card-content">
        {/* Product Form */}
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label>Product Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
              required
            />
          </div>

          <div className="grid-2 gap-4">
            <div className="form-group">
              <label>Price (ksh)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label>Stock</label>
              <input
                className="input"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Search */}
          <div className="form-group">
            <label>Search Products</label>
            <div className="search-input">
              <Search className="icon" />
              <input
                className="input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? (
                <>
                  <Pencil className="icon" />
                  Update Product
                </>
              ) : (
                <>
                  <Plus className="icon" />
                  Add Product
                </>
              )}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCancel}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Product List */}
        <div className="product-list">
          {filteredProducts.length === 0 ? (
            <p className="empty-text">No products found.</p>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="product-item">
                <div className="product-info">
                  <p className="product-name">{product.name || "Unnamed"}</p>
                  <p className="product-details">
                    ksh
                    {product.price !== undefined
                      ? product.price.toFixed(2)
                      : "0.00"}{" "}
                    · Stock: {product.stock !== undefined ? product.stock : 0}
                  </p>
                </div>

                <div className="product-actions">
                  <button
                    className="btn btn-outline btn-small btn-success"
                    onClick={() => handleSell(product)}
                  >
                    Sell
                  </button>

                  <button
                    className="btn btn-outline btn-small"
                    onClick={() => handleEdit(product)}
                  >
                    <Pencil className="icon" />
                  </button>

                  <button
                    className="btn btn-outline btn-small btn-danger"
                    onClick={() => deleteProduct(product.id)}
                  >
                    <Trash2 className="icon" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
