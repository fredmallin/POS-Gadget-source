// src/components/ProductManager.jsx
import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import "../index.css";
import { productsRef } from "../firebase";
import { onValue, push, update, remove, child } from "firebase/database";

export function ProductManager() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // 🔌 Detect online/offline
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 🔥 Fetch products (cached when offline)
  useEffect(() => {
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const productsArray = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      setProducts(productsArray);
    });

    return () => unsubscribe();
  }, []);

  // ➕ Add
  const addProduct = () => {
    if (!name || !price || !stock) return;

    push(productsRef, {
      name,
      price: Number(price),
      stock: Number(stock),
    });

    setName("");
    setPrice("");
    setStock("");
  };

  // ✏️ Update
  const updateProduct = () => {
    if (!editingId) return;

    update(child(productsRef, editingId), {
      name,
      price: Number(price),
      stock: Number(stock),
    });

    setEditingId(null);
    setName("");
    setPrice("");
    setStock("");
  };

  // 🗑 Delete
  const deleteProduct = (id) => {
    remove(child(productsRef, id));
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card">
      <div className="card-header">
        <h2>Product Management</h2>
        {isOffline && <span className="offline-badge">Offline mode</span>}
      </div>

      <div className="card-content">
        {/* FORM */}
        <div className="product-form">
          <input
            className="input"
            placeholder="Product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="input"
            type="number"
            placeholder="Price (KSh)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <input
            className="input"
            type="number"
            placeholder="Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />

          <button
            className="btn btn-primary"
            onClick={editingId ? updateProduct : addProduct}
          >
            {editingId ? "Update Product" : "Add Product"}
          </button>
        </div>

        {/* SEARCH */}
        <div className="search-input">
          <Search className="icon" />
          <input
            className="input"
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* LIST */}
        <div className="product-list">
          {filteredProducts.length === 0 ? (
            <p>No products</p>
          ) : (
            filteredProducts.map((p) => (
              <div key={p.id} className="product-item">
                <div>
                  <strong>{p.name}</strong>
                  <p>KSh {p.price} · Stock {p.stock}</p>
                </div>

                <div>
                  <button
                    onClick={() => {
                      setEditingId(p.id);
                      setName(p.name);
                      setPrice(p.price);
                      setStock(p.stock);
                    }}
                  >
                    <Pencil size={16} />
                  </button>

                  <button onClick={() => deleteProduct(p.id)}>
                    <Trash2 size={16} />
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
