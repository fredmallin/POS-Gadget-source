import React from 'react';
import { usePOS } from "../../contexts/POSContext";
import { useAuth } from "../../contexts/AuthContext";
import { AlertTriangle, Package } from 'lucide-react';
import { toast } from 'sonner';
import '../../index.css';

const LowStock = ({ onNavigate }) => {
  const { products = [], lowStockThreshold = 5, updateProduct } = usePOS(); // safe defaults
  const { isAdmin } = useAuth();

  // Compute low stock products safely
  const lowStockProducts = (products || []).filter(
    (p) => (p.stock || 0) <= lowStockThreshold
  );

  const handleQuickRestock = (productId, currentStock) => {
    updateProduct(productId, { stock: currentStock + 10 });
    toast.success('Stock updated (+10 units)');
  };

  return (
    <div className="lowstock-page">
      <div className="page-header">
        <h1>Low Stock Alert</h1>
        <p>
          Products with stock at or below {lowStockThreshold} units
        </p>
      </div>

      {/* Warning Card */}
      <div className="warning-card">
        <div className="warning-icon">
          <AlertTriangle />
        </div>
        <div>
          <h3>Low Stock Warning</h3>
          <p>
            {lowStockProducts.length} product(s) need restocking.
            Take action to avoid running out of stock.
          </p>
        </div>
      </div>

      {/* No Low Stock */}
      {lowStockProducts.length === 0 ? (
        <div className="card empty-card">
          <Package size={48} />
          <h3>All Stock Levels Good!</h3>
          <p>No products have low stock at this time</p>
        </div>
      ) : (
        <div className="card">
          <h3 className="card-title">
            <AlertTriangle size={18} />
            Low Stock Products ({lowStockProducts.length})
          </h3>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="bold">{product.name || 'Unknown'}</td>
                    <td>
                      <span className="badge outline">
                        {product.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="stock">{product.stock || 0}</td>
                    <td>${(product.price || 0).toFixed(2)}</td>
                    <td>
                      <span className="badge warning">
                        <AlertTriangle size={12} /> Low Stock
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <button
                          className="btn-outline small"
                          onClick={() =>
                            handleQuickRestock(
                              product.id,
                              product.stock || 0
                            )
                          }
                        >
                          Quick Restock (+10)
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin CTA */}
      {isAdmin && lowStockProducts.length > 0 && (
        <div className="card cta-card">
          <div>
            <h3>Need to add more products?</h3>
            <p>Add new stock or create new product entries</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => onNavigate('add-product')}
          >
            <Package size={16} />
            Add Product
          </button>
        </div>
      )}
    </div>
  );
};

export default LowStock;
