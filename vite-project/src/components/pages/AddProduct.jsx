import React, { useState } from 'react';
import { usePOS } from '../../contexts/POSContext';
import { PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
import '../../index.css';

export const AddProduct = () => {
  const { addProduct } = usePOS(); // now this works
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    sku: '',
    imageUrl: '',
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    addProduct({
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      category: formData.category,
      sku: formData.sku || undefined,
      imageUrl: formData.imageUrl || undefined,
    });

    toast.success('Product added successfully!');
    setFormData({
      name: '',
      price: '',
      stock: '',
      category: '',
      sku: '',
      imageUrl: '',
    });
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Add Product</h1>
      <p className="page-subtitle">Add a new product to your inventory</p>

      <div className="card">
        <div className="card-header">
          <PackagePlus size={20} className="icon" />
          Product Details
        </div>

        <form className="card-body" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>SKU / Barcode</label>
              <input
                type="text"
                value={formData.sku}
                onChange={e => handleChange('sku', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Price ($) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={e => handleChange('price', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Initial Stock *</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={e => handleChange('stock', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <input
                type="text"
                value={formData.category}
                onChange={e => handleChange('category', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Image URL (optional)</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={e => handleChange('imageUrl', e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              <PackagePlus size={16} /> Add Product
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() =>
                setFormData({
                  name: '',
                  price: '',
                  stock: '',
                  category: '',
                  sku: '',
                  imageUrl: '',
                })
              }
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
