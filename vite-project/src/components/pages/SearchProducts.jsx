import React, { useState } from 'react';
import { Search, Package, Barcode } from 'lucide-react';
import { usePOS } from '../../contexts/POSContext';
import '../../index.css';

const SearchProducts = () => {
  const { products = [] } = usePOS(); // safe default
  const [searchTerm, setSearchTerm] = useState('');

  // Safe filtering: use empty string fallback for undefined fields
  const filteredProducts = products.filter((p) => {
    const name = p.name || '';
    const category = p.category || '';
    const sku = p.sku || '';
    const term = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(term) ||
      category.toLowerCase().includes(term) ||
      sku.toLowerCase().includes(term)
    );
  });

  return (
    <div className="search-page">
      <header className="page-header">
        <h1>Search Products</h1>
        <p>Quickly find products by name, SKU, or category</p>
      </header>

      {/* Search Bar */}
      <div className="card">
        <div className="search-bar">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Type to search by name, SKU, or category..."
            value={searchTerm} // controlled input
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      {products.length === 0 ? (
        <div className="card empty-state">
          <Package size={48} />
          <p>No products available</p>
        </div>
      ) : (
        <div className="results-section">
          {searchTerm && (
            <p className="results-count">
              Found {filteredProducts.length} result(s) for "{searchTerm}"
            </p>
          )}

          {filteredProducts.length === 0 && searchTerm ? (
            <div className="card empty-state">
              <Package size={48} />
              <p>No products found</p>
              <span>Try a different search term</span>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-content">
                    <h3>{product.name || 'Unnamed Product'}</h3>
                    <span className="badge">{product.category || 'Uncategorized'}</span>

                    {product.sku && (
                      <div className="sku">
                        <Barcode size={16} />
                        <span>{product.sku}</span>
                      </div>
                    )}

                    <div className="product-row">
                      <div>
                        <span className="price">
                          ${Number(product.price || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="stock">
                        <span>Stock</span>
                        <strong className={Number(product.stock || 0) <= 10 ? 'low-stock' : ''}>
                          {Number(product.stock || 0)}
                        </strong>
                      </div>
                    </div>

                    <div className="product-value">
                      <span>Total Value</span>
                      <strong>
                        ${(Number(product.price || 0) * Number(product.stock || 0)).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!searchTerm && products.length > 0 && (
        <div className="product-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-content">
                <h3>{product.name || 'Unnamed Product'}</h3>
                <span className="badge">{product.category || 'Uncategorized'}</span>
                {product.sku && (
                  <div className="sku">
                    <Barcode size={16} />
                    <span>{product.sku}</span>
                  </div>
                )}
                <div className="product-row">
                  <div>
                    <span className="price">${Number(product.price || 0).toFixed(2)}</span>
                  </div>
                  <div className="stock">
                    <span>Stock</span>
                    <strong className={Number(product.stock || 0) <= 10 ? 'low-stock' : ''}>
                      {Number(product.stock || 0)}
                    </strong>
                  </div>
                </div>
                <div className="product-value">
                  <span>Total Value</span>
                  <strong>${(Number(product.price || 0) * Number(product.stock || 0)).toFixed(2)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {products.length === 0 && !searchTerm && (
        <div className="card empty-state">
          <Search size={48} />
          <p>Start adding products to see them here</p>
        </div>
      )}
    </div>
  );
};

export default SearchProducts;
