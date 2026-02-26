import React, { useState } from 'react';
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
    imageUrl: '',
  });

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      sku: product.sku || '',
      imageUrl: product.imageUrl || '',
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm(prev => ({
        ...prev,
        imageUrl: reader.result
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();

    updateProduct(editingProduct.id, {
      name: editForm.name,
      price: parseFloat(editForm.price),
      stock: parseInt(editForm.stock, 10),
      category: editForm.category,
      sku: editForm.sku || undefined,
      imageUrl: editForm.imageUrl || undefined,
    });

    toast.success('Product updated successfully!');
    setEditingProduct(null);
  };

  const handleDelete = (id, name) => {
    deleteProduct(id);
    toast.success(`Deleted ${name}`);
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
            <h2>All Products ({products.length})</h2>
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
                  <th>Value</th>
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
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: "12px", color: "#777" }}>
                          No Image
                        </div>
                      )}
                    </td>

                    <td className="bold">{product.name}</td>
                    <td>{product.sku || '—'}</td>
                    <td>{product.category}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td className={product.stock <= 10 ? 'low-stock' : ''}>
                      {product.stock}
                    </td>
                    <td className="bold">
                      ${(product.price * product.stock).toFixed(2)}
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn outline" onClick={() => handleEditClick(product)}>
                          <Edit className="icon-small" />
                        </button>

                        <button className="btn outline red" onClick={() => handleDelete(product.id, product.name)}>
                          <Trash2 className="icon-small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {editingProduct && (
            <div className="dialog-overlay">
              <div className="dialog">
                <h3>Edit Product</h3>

                <form onSubmit={handleEditSubmit}>
                  <label>Product Name</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />

                  <label>SKU</label>
                  <input
                    value={editForm.sku}
                    onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                  />

                  <label>Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    required
                  />

                  <label>Stock</label>
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    required
                  />

                  <label>Category</label>
                  <input
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    required
                  />

                  <label>Product Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                  />

                  {editForm.imageUrl && (
                    <img
                      src={editForm.imageUrl}
                      alt="preview"
                      style={{ width: "100px", marginTop: "10px", borderRadius: "6px" }}
                    />
                  )}

                  <div className="dialog-buttons">
                    <button type="submit" className="btn">Save Changes</button>
                    <button type="button" className="btn outline" onClick={() => setEditingProduct(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
