import React, { useState } from 'react';
import { usePOS } from '../../contexts/POSContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';
import '../../index.css';

export const PendingOrders = () => {
  const {
    products,
    pendingCart,
    addToPendingCart,
    removeFromPendingCart,
    clearPendingCart,
    pendingOrders,
    savePending,
    completePendingOrder,
    cancelPendingOrder,
  } = usePOS();

  // Get user from AuthContext — NOT from POSContext
  const { user } = useAuth();

  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const filteredProducts = products.filter((p) =>
    (p?.name || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;
    addToPendingCart(selectedProduct, quantity);
    setSelectedProduct(null);
    setProductSearch('');
    setQuantity(1);
  };

  const handleSavePending = async () => {
    if (!customerName.trim()) {
      toast.error('Please enter a customer name');
      return;
    }
    if (pendingCart.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    try {
      await savePending(customerName.trim(), notes.trim());
      toast.success('Pending order saved');
      setCustomerName('');
      setNotes('');
    } catch (err) {
      toast.error('Failed to save pending order');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    if (!orderId) return toast.error('Invalid order');
    try {
      await completePendingOrder(orderId, paymentMethod);
      toast.success('Order completed — stock updated and sale recorded');
    } catch (err) {
      toast.error('Failed to complete order');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!orderId) return toast.error('Invalid order');
    try {
      await cancelPendingOrder(orderId);
      toast('Order cancelled');
    } catch (err) {
      toast.error('Failed to cancel order');
    }
  };

  const pendingCartTotal = pendingCart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Show all orders, grouped by status for clarity
  const activePending = pendingOrders.filter((o) => o.status === 'Pending');
  const completedOrders = pendingOrders.filter((o) => o.status === 'Completed');
  const cancelledOrders = pendingOrders.filter((o) => o.status === 'Cancelled');

  return (
    <div className="pending-orders-page">
      <h1>Pending Orders</h1>
      <p>Save loan / credit orders — stock reduces only when marked complete</p>

      {/* ── New Pending Order Form ──────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3>New Pending Order</h3>

        <div className="form-group">
          <label>Customer Name *</label>
          <input
            type="text"
            placeholder="Enter customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="input"
          />
        </div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <input
            type="text"
            placeholder="e.g. Pay by Friday"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
          />
        </div>

        <div className="form-group">
          <label>Search Product</label>
          <input
            type="text"
            placeholder="Type product name..."
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              setSelectedProduct(null);
            }}
            className="input"
          />
        </div>

        {productSearch && !selectedProduct && (
          <ul className="product-search-list">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <li key={p.id} onClick={() => setSelectedProduct(p)}>
                  {p.name} — Ksh{Number(p.price).toFixed(2)} (Stock: {p.stock})
                </li>
              ))
            ) : (
              <li>No products found</li>
            )}
          </ul>
        )}

        {selectedProduct && (
          <div className="selected-product-form">
            <p>
              <strong>{selectedProduct.name}</strong> — Ksh
              {Number(selectedProduct.price).toFixed(2)}
            </p>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
            <button onClick={handleAddItem}>Add Item</button>
            <button onClick={() => setSelectedProduct(null)}>Cancel</button>
          </div>
        )}

        {/* Cart preview */}
        {pendingCart.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h4>Items to Save</h4>
            <ul>
              {pendingCart.map((item) => (
                <li key={item.productId}>
                  {item.productName} × {item.quantity} — Ksh
                  {(item.price * item.quantity).toFixed(2)}
                  <button
                    onClick={() => removeFromPendingCart(item.productId)}
                    style={{ marginLeft: '8px' }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <p>
              <strong>Total: Ksh{pendingCartTotal.toFixed(2)}</strong>
            </p>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={handleSavePending}>Save Pending Order</button>
              <button onClick={clearPendingCart}>Clear</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Payment method for completing orders ────────────────────────── */}
      <div style={{ marginBottom: '1rem' }}>
        <label>Payment method when completing: </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option>Cash</option>
          <option>Card</option>
          <option>Mobile Payment</option>
        </select>
      </div>

      {/* ── Active Pending Orders ────────────────────────────────────────── */}
      <h2>Active Pending ({activePending.length})</h2>
      {activePending.length === 0 ? (
        <p>No pending orders.</p>
      ) : (
        <table className="pending-orders-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Notes</th>
              <th>Items</th>
              <th>Total</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activePending.map((order) => (
              <tr key={order.id}>
                <td>{order.customerName || 'Unknown'}</td>
                <td>{order.notes || '—'}</td>
                <td>
                  {(order.items || [])
                    .map((i) => `${i.productName} ×${i.quantity}`)
                    .join(', ')}
                </td>
                <td>Ksh{Number(order.total).toFixed(2)}</td>
                <td>
                  {order.date ? new Date(order.date).toLocaleString() : '—'}
                </td>
                <td style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleCompleteOrder(order.id)}
                    className="btn complete"
                  >
                    <CheckCircle size={14} /> Complete
                  </button>
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="btn cancel"
                  >
                    <XCircle size={14} /> Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── Completed Orders ─────────────────────────────────────────────── */}
      {completedOrders.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem' }}>
            Completed ({completedOrders.length})
          </h2>
          <table className="pending-orders-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Ordered</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {completedOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.customerName || 'Unknown'}</td>
                  <td>
                    {(order.items || [])
                      .map((i) => `${i.productName} ×${i.quantity}`)
                      .join(', ')}
                  </td>
                  <td>Ksh{Number(order.total).toFixed(2)}</td>
                  <td>
                    {order.date ? new Date(order.date).toLocaleString() : '—'}
                  </td>
                  <td>
                    {order.completedAt
                      ? new Date(order.completedAt).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ── Cancelled Orders ─────────────────────────────────────────────── */}
      {cancelledOrders.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem' }}>
            Cancelled ({cancelledOrders.length})
          </h2>
          <table className="pending-orders-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {cancelledOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.customerName || 'Unknown'}</td>
                  <td>
                    {(order.items || [])
                      .map((i) => `${i.productName} ×${i.quantity}`)
                      .join(', ')}
                  </td>
                  <td>Ksh{Number(order.total).toFixed(2)}</td>
                  <td>
                    {order.date ? new Date(order.date).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};
