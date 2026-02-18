import React, { useState, useEffect } from 'react';
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
    user,
    setUser,
    setToken
  } = usePOS();

  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  // 🔥 TEMP: ensure user exists for testing
  useEffect(() => {
    if (!user) {
      const fakeUser = { id: 'test-user', username: 'tester' };
      setUser(fakeUser);
      setToken('fake-token');
      localStorage.setItem('user', JSON.stringify(fakeUser));
      localStorage.setItem('token', 'fake-token');
    }
  }, [user, setUser, setToken]);

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

  const handleCompleteOrder = (orderId) => {
    if (!user || !user.id) {
      toast.error("User not found. Please login again.");
      return;
    }
    completePendingOrder(orderId);
    toast.success("Order completed");
  };

  const handleCancelOrder = (orderId) => {
    cancelPendingOrder(orderId);
    toast("Order canceled");
  };

  if (!user) return <p>Loading user info...</p>;

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

      {/* Cart */}
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
  <tr key={order?.id || Math.random()}>
    <td>{order?.customerName || "Unknown"}</td>
    <td>${order?.total?.toFixed(2) || "0.00"}</td>
    <td>{order?.date ? new Date(order.date).toLocaleString() : "-"}</td>
    <td>
      <button
        onClick={() => order?.id && handleCompleteOrder(order)}
        className="btn complete"
        disabled={!order?.id}
      >
        <CheckCircle /> Complete
      </button>

      <button
        onClick={() => order?.id && handleCancelOrder(order)}
        className="btn cancel"
        disabled={!order?.id}
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
