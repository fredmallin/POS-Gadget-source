import React, { useState, useEffect } from 'react';
import { usePOS } from '../../contexts/POSContext';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';
import '../../index.css';

export const PendingOrders = () => {
  const { products, updateProduct } = usePOS();

  // Form states
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Pending orders (persistent)
  const [pendingOrders, setPendingOrders] = useState(() => {
    // Load from localStorage on first render
    const saved = localStorage.getItem('pendingOrders');
    return saved ? JSON.parse(saved).map(order => ({
      ...order,
      createdAt: new Date(order.createdAt) // restore Date objects
    })) : [];
  });

  // Save pending orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
  }, [pendingOrders]);

  // Filter products as user types
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleAddToPending = () => {
    if (!selectedProduct || !customerName || quantity <= 0) return;

    const order = {
      id: Date.now().toString(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      totalAmount: selectedProduct.price * quantity,
      customerName,
      notes,
      createdAt: new Date(),
    };

    setPendingOrders([order, ...pendingOrders]);
    toast.success(`Added order for ${customerName}`);

    // Reset form
    setSelectedProduct(null);
    setProductSearch('');
    setQuantity(1);
    setNotes('');
  };

  const handleCompleteOrder = (orderId) => {
    const order = pendingOrders.find(o => o.id === orderId);
    if (order) {
      const product = products.find(p => p.id === order.productId);
      if (product) {
        updateProduct(order.productId, { stock: product.stock - order.quantity });
      }
      toast.success(`Order for ${order.customerName} completed!`);
    }
    setPendingOrders(pendingOrders.filter(o => o.id !== orderId));
  };

  const handleCancelOrder = (orderId) => {
    const order = pendingOrders.find(o => o.id === orderId);
    if (order) toast('Order canceled');
    setPendingOrders(pendingOrders.filter(o => o.id !== orderId));
  };

  return (
    <div className="pending-orders-page">
      <h1>Pending Orders</h1>

      {/* Customer Name */}
      <input
        type="text"
        placeholder="Enter customer name"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
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

      {/* Filtered product list */}
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

      {/* Selected product & quantity/notes */}
      {selectedProduct && (
        <div className="selected-product-form">
          <p>Selected: {selectedProduct.name}</p>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            placeholder="Quantity"
          />
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
          />
          <button onClick={handleAddToPending}>Add to Pending</button>
        </div>
      )}

      {/* Pending Orders List */}
      <h2>Pending Orders ({pendingOrders.length})</h2>
      {pendingOrders.length === 0 ? (
        <p>No pending orders yet.</p>
      ) : (
        <table className="pending-orders-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Notes</th>
              <th>Total</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingOrders.map(order => (
              <tr key={order.id}>
                <td>{order.customerName}</td>
                <td>{order.productName}</td>
                <td>{order.quantity}</td>
                <td>{order.notes || '-'}</td>
                <td>${order.totalAmount.toFixed(2)}</td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => handleCompleteOrder(order.id)}
                    className="btn complete"
                  >
                    <CheckCircle /> Complete
                  </button>
                  <button
                    onClick={() => handleCancelOrder(order.id)}
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
