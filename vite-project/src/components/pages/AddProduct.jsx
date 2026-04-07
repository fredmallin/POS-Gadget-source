import React, { useState, useRef } from 'react';
import { usePOS } from '../../contexts/POSContext';
import { PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
import '../../index.css';

export const AddProduct = () => {
  const { addProduct } = usePOS();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    sku: '',
  });

  // Store the actual File object, not base64
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    // Only use for local preview — actual upload goes to Firebase Storage
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      // Pass the File object — POSContext uploads it to Firebase Storage
      await addProduct(
        {
          name: formData.name,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10),
          category: formData.category,
          sku: formData.sku || '',
        },
        imageFile  // File object or null
      );

      toast.success('Product added successfully!');

      setFormData({ name: '', price: '', stock: '', category: '', sku: '' });
      setImageFile(null);
      setImagePreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error('Failed to add product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData({ name: '', price: '', stock: '', category: '', sku: '' });
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              <label>Price (Ksh) *</label>
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
              <label>Product Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                ref={fileInputRef}
              />
              <small style={{ color: '#666' }}>
                Image is uploaded to cloud storage — not stored in the database
              </small>
              {imagePreview && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                    }}
                  />
                </div>
              )}
            </div>

          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              <PackagePlus size={16} />
              {submitting ? 'Adding...' : 'Add Product'}
            </button>

            <button
              type="button"
              className="btn-outline"
              onClick={handleClear}
              disabled={submitting}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
