import React, { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import '../index.css';

export function ProductManager({ products, addProduct, updateProduct, deleteProduct }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [editingId, setEditingId] = useState(null);

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

    setName('');
    setPrice('');
    setStock('');
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setStock('');
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Product Management</h2>
      </div>
      <div className="card-content">
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
              <label>Price ($)</label>
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
              <button type="button" className="btn btn-outline" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="product-list">
          {products.map((product) => (
            <div key={product.id} className="product-item">
              <div className="product-info">
                <p className="product-name">{product.name}</p>
                <p className="product-details">
                  ${product.price.toFixed(2)} · Stock: {product.stock}
                </p>
              </div>
              <div className="product-actions">
                <button className="btn btn-outline btn-small" onClick={() => handleEdit(product)}>
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
          ))}
        </div>
      </div>
    </div>
  );
}
