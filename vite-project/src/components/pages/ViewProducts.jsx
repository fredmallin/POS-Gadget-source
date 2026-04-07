import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePOS } from '../../contexts/POSContext';
import { toast } from 'sonner';
import { Search, Edit, Trash2, Package } from 'lucide-react';
import '../../index.css';

export const ViewProducts = () => {
  const { products, updateProduct, deleteProduct } = usePOS();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    sku: '',
  });

  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredProducts = (products || []).filter((p) => {
    if (!p) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term) ||
      (p.sku || '').toLowerCase().includes(term)
    );
  });

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      sku: product.sku || '',
    });
    setEditImageFile(null);
    setEditImagePreview(product.imageUrl || '');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateProduct(
        editingProduct.id,
        {
          name: editForm.name,
          price: parseFloat(editForm.price),
          stock: parseInt(editForm.stock, 10),
          category: editForm.category,
          sku: editForm.sku || '',
          imageUrl: editingProduct.imageUrl || '',
        },
        editImageFile
      );
      toast.success('Product updated successfully!');
      setEditingProduct(null);
      setEditImageFile(null);
      setEditImagePreview('');
    } catch (err) {
      toast.error('Failed to update product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setEditingProduct(null);
    setEditImageFile(null);
    setEditImagePreview('');
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product.id); // Cloudinary — no imageUrl needed
      toast.success(`Deleted ${product.name}`);
    } catch (err) {
      toast.error('Failed to delete product.');
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>View Products</h1>
        <p>Browse and manage your product inventory</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="header-left">
            <Package className="icon-medium" />
            <h2>All Products ({(products || []).length})</h2>
          </div>
          <div className="header-right">
            <Search className="icon-small search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="card-content">
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <Package className="icon-large" />
              <p>No products found</p>
            </div>
          ) : (
            <table className="product-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: '12px', color: '#777' }}>No Image</div>
                      )}
                    </td>
                    <td className="bold">{product.name}</td>
                    <td>{product.sku || '—'}</td>
                    <td>{product.category}</td>
                    <td>Ksh{product.price.toFixed(2)}</td>
                    <td className={product.stock <= 10 ? 'low-stock' : ''}>
                      {product.stock}
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn outline"
                          onClick={() => handleEditClick(product)}
                        >
                          <Edit className="icon-small" />
                        </button>
                        <button
                          className="btn outline red"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="icon-small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Dialog — rendered via Portal directly on document.body
          so it sits above the sidebar and all other layout elements */}
      {editingProduct && createPortal(
        <div
          onClick={handleCloseDialog}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ marginBottom: '16px' }}>Edit Product</h3>

            <form onSubmit={handleEditSubmit}>
              <label>Product Name</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
                style={{ width: '100%', marginBottom: '10px' }}
              />

              <label>SKU</label>
              <input
                value={editForm.sku}
                onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                style={{ width: '100%', marginBottom: '10px' }}
              />

              <label>Price (Ksh)</label>
              <input
                type="number"
                step="0.01"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                required
                style={{ width: '100%', marginBottom: '10px' }}
              />

              <label>Stock</label>
              <input
                type="number"
                value={editForm.stock}
                onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                required
                style={{ width: '100%', marginBottom: '10px' }}
              />

              <label>Category</label>
              <input
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                required
                style={{ width: '100%', marginBottom: '10px' }}
              />

              <label>Product Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ width: '100%', marginBottom: '6px' }}
              />
              <small style={{ color: '#666', display: 'block', marginBottom: '10px' }}>
                Leave blank to keep existing image
              </small>

              {editImagePreview && (
                <img
                  src={editImagePreview}
                  alt="preview"
                  style={{
                    width: '100px',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '1px solid #ddd',
                  }}
                />
              )}

              <div className="dialog-buttons">
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="btn outline"
                  onClick={handleCloseDialog}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
