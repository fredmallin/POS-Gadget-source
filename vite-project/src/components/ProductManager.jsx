// src/components/ProductManager.jsx
import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import "../index.css";

import { productsRef, storage } from "../firebase";
import { onValue, push, update, remove, child } from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export default function ProductManager() {
  const [products, setProducts] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  /* =========================
     FETCH PRODUCTS (REALTIME)
  ========================== */
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

  /* =========================
     ADD PRODUCT
  ========================== */
  const addProduct = async () => {
    let imageUrl = "";

    if (imageFile) {
      const imgRef = storageRef(
        storage,
        `products/${Date.now()}_${imageFile.name}`
      );
      await uploadBytes(imgRef, imageFile);
      imageUrl = await getDownloadURL(imgRef);
    }

    push(productsRef, {
      name,
      price: Number(price),
      stock: Number(stock),
      imageUrl,
    });

    resetForm();
  };

  /* =========================
     UPDATE PRODUCT
  ========================== */
  const updateProduct = async () => {
    const productRef = child(productsRef, editingId);

    let updates = {
      name,
      price: Number(price),
      stock: Number(stock),
    };

    if (imageFile) {
      const imgRef = storageRef(
        storage,
        `products/${Date.now()}_${imageFile.name}`
      );
      await uploadBytes(imgRef, imageFile);
      const imageUrl = await getDownloadURL(imgRef);
      updates.imageUrl = imageUrl;
    }

    update(productRef, updates);
    resetForm();
  };

  /* =========================
     DELETE PRODUCT
  ========================== */
  const deleteProduct = (id) => {
    const productRef = child(productsRef, id);
    remove(productRef);
  };

  /* =========================
     FORM SUBMIT
  ========================== */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !price || !stock) return;

    editingId ? updateProduct() : addProduct();
  };

  /* =========================
     EDIT PRODUCT
  ========================== */
  const handleEdit = (product) => {
    setEditingId(product.id);
    setName(product.name || "");
    setPrice(product.price?.toString() || "");
    setStock(product.stock?.toString() || "");
    setImageFile(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setStock("");
    setImageFile(null);
  };

  /* =========================
     FILTER PRODUCTS
  ========================== */
  const filteredProducts = products.filter(
    (p) =>
      p.name &&
      typeof p.name === "string" &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Product Management</h2>
      </div>

      <div className="card-content">
        {/* FORM */}
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

          <div className="form-group">
            <label>Product Image</label>
            <input
              type="file"
              accept="image/*"
              className="input"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
          </div>

          <div className="grid-2 gap-4">
            <div className="form-group">
              <label>Price (KSh)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
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
                required
              />
            </div>
          </div>

          {/* SEARCH */}
          <div className="form-group">
            <label>Search Products</label>
            <div className="search-input">
              <Search className="icon" />
              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? (
                <>
                  <Pencil className="icon" /> Update Product
                </>
              ) : (
                <>
                  <Plus className="icon" /> Add Product
                </>
              )}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* PRODUCT LIST */}
        <div className="product-list">
          {filteredProducts.length === 0 ? (
            <p className="empty-text">No products found.</p>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="product-item">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="product-image"
                  />
                )}

                <div className="product-info">
                  <p className="product-name">{product.name}</p>
                  <p className="product-details">
                    KSh {product.price?.toFixed(2)} · Stock: {product.stock}
                  </p>
                </div>

                <div className="product-actions">
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
