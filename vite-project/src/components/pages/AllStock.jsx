import React, { useState } from 'react';
import { usePOS } from '../../contexts/POSContext';
import { Warehouse, Search } from 'lucide-react';
import '../../index.css';

export const AllStock = () => {
  const { products = [] } = usePOS(); 
  const [searchTerm, setSearchTerm] = useState('');
  const filteredProducts = (products || []).filter(
    (p) =>
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStockValue = (products || []).reduce(
    (sum, p) => sum + ((p.price || 0) * (p.stock || 0)),
    0
  );

  const totalItems = (products || []).reduce((sum, p) => sum + (p.stock || 0), 0);

  const categories = [...new Set((products || []).map(p => p.category || 'Uncategorized'))];

  const categoryStats = categories.map(cat => {
    const items = (products || []).filter(p => p.category === cat);
    return {
      category: cat,
      count: items.reduce((s, p) => s + (p.stock || 0), 0),
      value: items.reduce((s, p) => s + ((p.price || 0) * (p.stock || 0)), 0),
    };
  });

  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="page-title">All Stock</h1>
        <p className="page-subtitle">Complete overview of your inventory</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-content">
            <p className="text-gray">Total Products</p>
            <p className="stat">{products.length}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <p className="text-gray">Total Items in Stock</p>
            <p className="stat">{totalItems}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <p className="text-gray">Total Stock Value</p>
            <p className="stat text-green">${totalStockValue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Stock by Category</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.map(stat => (
              <div key={stat.category} className="category-card">
                <span className="badge">{stat.category}</span>
                <p>Items: {stat.count}</p>
                <p className="font-bold">Value: ${stat.value.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex-between">
          <h3 className="flex">
            <Warehouse size={18} /> Stock Details
          </h3>

          <div className="search-box">
            <Search size={16} />
            <input
              placeholder="Search stock..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="card-body">
          {filteredProducts.length === 0 ? (
            <p className="empty">No stock found</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock</th>
                  <th>Total Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const price = p.price || 0;
                  const stock = p.stock || 0;
                  const value = price * stock;
                  const isOut = stock === 0;
                  const isLow = stock > 0 && stock <= 10;

                  return (
                    <tr key={p.id}>
                      <td className="font-bold">{p.name || 'Unknown'}</td>
                      <td><span className="badge-outline">{p.category || 'Uncategorized'}</span></td>
                      <td>${price.toFixed(2)}</td>
                      <td
                        className={
                          isOut ? 'text-red' : isLow ? 'text-orange' : 'text-green'
                        }
                      >
                        {stock}
                      </td>
                      <td className="font-bold">${value.toFixed(2)}</td>
                      <td>
                        {isOut ? (
                          <span className="badge-red">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge-orange">Low Stock</span>
                        ) : (
                          <span className="badge-green">In Stock</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
