import React, { useState } from 'react';
import { usePOS } from '../../contexts/POSContext';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';
import '../../index.css';

export const PendingOrders = () => {
  const {
    products,
    cart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    pendingOrders,
    savePending,
    completePendingOrder,
    cancelPendingOrder,
  } = usePOS();

  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;

    addToCart(selectedProduct, quantity);
    setSelectedProduct(null);
    setProductSearch('');
    setQuantity(1);
  };

  const handleSavePending = () => {
    if (!customerName || cart.length === 0) {
      toast.error("Add items and customer name first");
      return;
    }

    savePending(customerName, notes);
    toast.success("Pending order saved");

    setCustomerName('');
    setNotes('');
  };

  return (
    <div className="pending-orders-page">
      <h1>Pending Orders</h1>

      {/* Customer */}
      <input
        type="text"
        placeholder="Customer name"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        className="input"
      />

      {/* Notes */}
      <input
        type="text"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="input"
      />

      {/* Product Search */}
      <input
        type="text"
        placeholder="Search product..."
        value={productSearch}
        onChange={(e) => setProductSearch(e.target.value)}
        className="input"
      />

      {/* Product List */}
      {productSearch && !selectedProduct && (
        <ul className="product-search-list">
          {filteredProducts.map(p => (
            <li key={p.id} onClick={() => setSelectedProduct(p)}>
              {p.name} - ${p.price.toFixed(2)} (Stock: {p.stock})
            </li>
          ))}
          {filteredProducts.length === 0 && <li>No products found</li>}
        </ul>
      )}

      {/* Selected Product */}
      {selectedProduct && (
        <div className="selected-product-form">
          <p>Selected: {selectedProduct.name}</p>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
          />
          <button onClick={handleAddItem}>Add Item</button>
        </div>
      )}

      {/* Cart / Temporary Items */}
      {cart.length > 0 && (
        <div>
          <h3>Items to Save</h3>
          <ul>
            {cart.map(item => (
              <li key={item.productId}>
                {item.productName} × {item.quantity}
                <button onClick={() => removeFromCart(item.productId)}>Remove</button>
              </li>
            ))}
          </ul>
          <button onClick={handleSavePending}>Save Pending Order</button>
        </div>
      )}

      {/* Pending Orders Table */}
      <h2>Pending Orders ({pendingOrders.length})</h2>

      {pendingOrders.length === 0 ? (
        <p>No pending orders yet.</p>
      ) : (
        <table className="pending-orders-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Total</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingOrders.map(order => (
              <tr key={order.id}>
                <td>{order.customerName}</td>
                <td>${order.total.toFixed(2)}</td>
                <td>{new Date(order.date).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => {
                      completePendingOrder(order.id);
                      toast.success("Order completed");
                    }}
                    className="btn complete"
                  >
                    <CheckCircle /> Complete
                  </button>

                  <button
                    onClick={() => {
                      cancelPendingOrder(order.id);
                      toast("Order canceled");
                    }}
                    className="btn cancel"
                  >
                    <XCircle /> Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
