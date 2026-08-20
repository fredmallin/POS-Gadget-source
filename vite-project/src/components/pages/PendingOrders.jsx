import React, { useState } from 'react';
import { usePOS } from '../../contexts/POSContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import {
  CheckCircle,
  XCircle,
  Trash2,
} from 'lucide-react';
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

    // Individual item actions
    completePendingItem,
    cancelPendingItem,

    // Delete completed/cancelled record
    deletePendingOrder,
  } = usePOS();

  const { user } = useAuth();

  // ============================================================
  // STATE
  // ============================================================

  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // ============================================================
  // SEARCH PRODUCTS
  // ============================================================

  const filteredProducts = products.filter((p) =>
    (p?.name || '')
      .toLowerCase()
      .includes(productSearch.toLowerCase())
  );

  // ============================================================
  // ADD ITEM
  // ============================================================

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    addToPendingCart(selectedProduct, quantity);

    setSelectedProduct(null);
    setProductSearch('');
    setQuantity(1);
  };

  // ============================================================
  // SAVE PENDING ORDER
  // ============================================================

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
      await savePending(
        customerName.trim(),
        notes.trim()
      );

      toast.success('Pending order saved');

      setCustomerName('');
      setNotes('');
    } catch (err) {
      console.error('Save pending error:', err);
      toast.error('Failed to save pending order');
    }
  };

  // ============================================================
  // COMPLETE INDIVIDUAL ITEM
  // ============================================================

  const handleCompleteItem = async (orderId, itemId) => {
    if (!orderId || !itemId) {
      toast.error('Invalid order or item');
      return;
    }

    try {
      await completePendingItem(
        orderId,
        itemId,
        paymentMethod
      );

      toast.success(
        'Item completed — stock updated and sale recorded'
      );
    } catch (err) {
      console.error('Complete item error:', err);

      toast.error(
        err?.message || 'Failed to complete item'
      );
    }
  };

  // ============================================================
  // CANCEL INDIVIDUAL ITEM
  // ============================================================

  const handleCancelItem = async (orderId, itemId) => {
    if (!orderId || !itemId) {
      toast.error('Invalid order or item');
      return;
    }

    try {
      await cancelPendingItem(
        orderId,
        itemId
      );

      toast.success('Item cancelled');
    } catch (err) {
      console.error('Cancel item error:', err);

      toast.error(
        err?.message || 'Failed to cancel item'
      );
    }
  };

  // ============================================================
  // DELETE COMPLETED / CANCELLED RECORD
  // ============================================================

  const handleDeleteOrder = async (orderId) => {
    if (!orderId) {
      toast.error('Invalid order');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this record?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await deletePendingOrder(orderId);

      toast.success('Record deleted');
    } catch (err) {
      console.error('Delete order error:', err);

      toast.error(
        err?.message || 'Failed to delete record'
      );
    }
  };

  // ============================================================
  // PENDING CART TOTAL
  // ============================================================

  const pendingCartTotal = pendingCart.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  // ============================================================
  // FILTER ORDERS
  // ============================================================

  const activePending = pendingOrders.filter(
    (o) => o.status === 'Pending'
  );

  const completedOrders = pendingOrders.filter(
    (o) => o.status === 'Completed'
  );

  const cancelledOrders = pendingOrders.filter(
    (o) => o.status === 'Cancelled'
  );

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <div className="pending-orders-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <h1>Pending Orders</h1>

      <p>
        Save loan / credit orders — stock reduces only
        when marked complete
      </p>

      {/* ======================================================
          NEW PENDING ORDER
      ====================================================== */}

      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
        }}
      >
        <h3>New Pending Order</h3>

        {/* CUSTOMER NAME */}

        <div className="form-group">
          <label>Customer Name *</label>

          <input
            type="text"
            placeholder="Enter customer name"
            value={customerName}
            onChange={(e) =>
              setCustomerName(e.target.value)
            }
            className="input"
          />
        </div>

        {/* NOTES */}

        <div className="form-group">
          <label>Notes (optional)</label>

          <input
            type="text"
            placeholder="e.g. Pay by Friday"
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
            className="input"
          />
        </div>

        {/* SEARCH PRODUCT */}

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

        {/* ==================================================
            SEARCH RESULTS
        ================================================== */}

        {productSearch && !selectedProduct && (
          <ul
            className="product-search-list"
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '8px 0 0',
              border: '1px solid #ddd',
              borderRadius: '6px',
              background: '#fff',
              maxHeight: '180px',
              overflowY: 'auto',
            }}
          >
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <li
                  key={p.id}
                  onClick={() =>
                    setSelectedProduct(p)
                  }
                  style={{
                    padding: '9px 12px',
                    cursor: 'pointer',
                    borderBottom:
                      '1px solid #eee',
                    fontSize: '14px',
                  }}
                >
                  <strong>{p.name}</strong>
                  {' — '}
                  Ksh
                  {Number(p.price).toFixed(2)}
                  {' '}

                  <span
                    style={{
                      color: '#666',
                      fontSize: '13px',
                    }}
                  >
                    (Stock: {p.stock})
                  </span>
                </li>
              ))
            ) : (
              <li
                style={{
                  padding: '10px 12px',
                  color: '#777',
                  fontSize: '14px',
                }}
              >
                No products found
              </li>
            )}
          </ul>
        )}

        {/* ==================================================
            SELECTED PRODUCT
        ================================================== */}

        {selectedProduct && (
          <div
            className="selected-product-form"
            style={{
              marginTop: '10px',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '7px',
              background: '#f8f9fa',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '14px',
              }}
            >
              <strong>
                {selectedProduct.name}
              </strong>

              {' — '}

              Ksh
              {Number(
                selectedProduct.price
              ).toFixed(2)}
            </p>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  parseInt(
                    e.target.value
                  ) || 1
                )
              }
              style={{
                width: '65px',
                padding: '7px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                textAlign: 'center',
              }}
            />

            <button
              onClick={handleAddItem}
              style={{
                padding: '7px 12px',
                border: 'none',
                borderRadius: '5px',
                background: '#16a34a',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Add Item
            </button>

            <button
              onClick={() =>
                setSelectedProduct(null)
              }
              style={{
                padding: '7px 12px',
                border: 'none',
                borderRadius: '5px',
                background: '#dc2626',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* ==================================================
            CART PREVIEW
        ================================================== */}

        {pendingCart.length > 0 && (
          <div
            style={{
              marginTop: '1rem',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '7px',
              background: '#fff',
            }}
          >
            <h4
              style={{
                margin: '0 0 10px',
                fontSize: '15px',
              }}
            >
              Items to Save
            </h4>

            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
              }}
            >
              {pendingCart.map((item) => (
                <li
                  key={item.productId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                      'space-between',
                    gap: '10px',
                    padding: '8px 0',
                    borderBottom:
                      '1px solid #eee',
                    fontSize: '14px',
                  }}
                >
                  <span>
                    <strong>
                      {item.productName}
                    </strong>

                    {' × '}

                    {item.quantity}

                    {' — Ksh '}

                    {(
                      Number(item.price) *
                      Number(item.quantity)
                    ).toFixed(2)}
                  </span>

                  <button
                    onClick={() =>
                      removeFromPendingCart(
                        item.productId
                      )
                    }
                    style={{
                      padding: '5px 9px',
                      border: 'none',
                      borderRadius: '5px',
                      background: '#dc2626',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <p
              style={{
                margin: '12px 0 8px',
                fontSize: '15px',
              }}
            >
              <strong>
                Total: Ksh
                {pendingCartTotal.toFixed(2)}
              </strong>
            </p>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '8px',
              }}
            >
              <button
                onClick={handleSavePending}
                style={{
                  padding: '8px 13px',
                  border: 'none',
                  borderRadius: '5px',
                  background: '#2563eb',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Save Pending Order
              </button>

              <button
                onClick={clearPendingCart}
                style={{
                  padding: '8px 13px',
                  border: 'none',
                  borderRadius: '5px',
                  background: '#6b7280',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================
          PAYMENT METHOD
      ====================================================== */}

      <div
        style={{
          marginBottom: '1rem',
        }}
      >
        <label>
          Payment method when completing:{' '}
        </label>

        <select
          value={paymentMethod}
          onChange={(e) =>
            setPaymentMethod(
              e.target.value
            )
          }
        >
          <option value="Cash">
            Cash
          </option>

          <option value="Card">
            Card
          </option>

          <option value="Mobile Payment">
            Mobile Payment
          </option>
        </select>
      </div>

      {/* ======================================================
          ACTIVE PENDING
      ====================================================== */}

      <h2>
        Active Pending ({activePending.length})
      </h2>

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
            {activePending.map((order) => {
              const items = order.items || [];

              return items.map((item, index) => {
                const itemId =
                  item.id ||
                  item.itemId ||
                  item.productId;

                return (
                  <tr
                    key={`${order.id}-${itemId || index}`}
                  >

                    {/* CUSTOMER */}
                    {index === 0 && (
                      <td
                        rowSpan={items.length}
                      >
                        {order.customerName ||
                          'Unknown'}
                      </td>
                    )}

                    {/* NOTES */}
                    {index === 0 && (
                      <td
                        rowSpan={items.length}
                      >
                        {order.notes || '—'}
                      </td>
                    )}

                    {/* ITEM */}
                    <td>
                      {item.productName}
                      {' ×'}
                      {item.quantity}
                    </td>

                    {/* TOTAL */}
                    {index === 0 && (
                      <td
                        rowSpan={items.length}
                      >
                        Ksh
                        {Number(
                          order.total || 0
                        ).toFixed(2)}
                      </td>
                    )}

                    {/* DATE */}
                    {index === 0 && (
                      <td
                        rowSpan={items.length}
                      >
                        {order.date
                          ? new Date(
                              order.date
                            ).toLocaleString()
                          : '—'}
                      </td>
                    )}

                    {/* ACTIONS */}
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <button
                          onClick={() =>
                            handleCompleteItem(
                              order.id,
                              itemId
                            )
                          }
                          className="btn complete"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '7px 10px',
                            border: 'none',
                            borderRadius: '6px',
                            background:
                              '#16a34a',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          <CheckCircle
                            size={14}
                          />
                          Complete
                        </button>

                        <button
                          onClick={() =>
                            handleCancelItem(
                              order.id,
                              itemId
                            )
                          }
                          className="btn cancel"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '7px 10px',
                            border: 'none',
                            borderRadius: '6px',
                            background:
                              '#dc2626',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          <XCircle
                            size={14}
                          />
                          Cancel
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              });
            })}
          </tbody>

        </table>
      )}

      {/* ======================================================
          COMPLETED
      ====================================================== */}

      {completedOrders.length > 0 && (
        <>
          <h2
            style={{
              marginTop: '2rem',
            }}
          >
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
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {completedOrders.map((order) => (
                <tr key={order.id}>

                  <td>
                    {order.customerName ||
                      'Unknown'}
                  </td>

                  <td>
                    {(order.items || [])
                      .map(
                        (i) =>
                          `${i.productName} ×${i.quantity}`
                      )
                      .join(', ')}
                  </td>

                  <td>
                    Ksh
                    {Number(
                      order.total || 0
                    ).toFixed(2)}
                  </td>

                  <td>
                    {order.date
                      ? new Date(
                          order.date
                        ).toLocaleString()
                      : '—'}
                  </td>

                  <td>
                    {order.completedAt
                      ? new Date(
                          order.completedAt
                        ).toLocaleString()
                      : '—'}
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteOrder(
                          order.id
                        )
                      }
                      title="Delete completed record"
                      style={{
                        width: '30px',
                        height: '30px',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#dc2626',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </>
      )}

      {/* ======================================================
          CANCELLED
      ====================================================== */}

      {cancelledOrders.length > 0 && (
        <>
          <h2
            style={{
              marginTop: '2rem',
            }}
          >
            Cancelled ({cancelledOrders.length})
          </h2>

          <table className="pending-orders-table">

            <thead>
              <tr>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {cancelledOrders.map((order) => (
                <tr key={order.id}>

                  <td>
                    {order.customerName ||
                      'Unknown'}
                  </td>

                  <td>
                    {(order.items || [])
                      .map(
                        (i) =>
                          `${i.productName} ×${i.quantity}`
                      )
                      .join(', ')}
                  </td>

                  <td>
                    Ksh
                    {Number(
                      order.total || 0
                    ).toFixed(2)}
                  </td>

                  <td>
                    {order.date
                      ? new Date(
                          order.date
                        ).toLocaleString()
                      : '—'}
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteOrder(
                          order.id
                        )
                      }
                      title="Delete cancelled record"
                      style={{
                        width: '30px',
                        height: '30px',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#dc2626',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
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