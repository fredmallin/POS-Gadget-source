// src/components/PendingSales.jsx
import { useState } from "react";
import { Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import { Search } from "lucide-react";
import "../index.css";

export function PendingSales({
  products = [],
  pendingOrders = [],
  onHoldOrder,
  onCompleteOrder,
  onCancelOrder
}) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // -------------------
  // Filter products safely
  // -------------------
  const filteredProducts = products.filter(
    (p) =>
      p.name && typeof p.name === "string" &&
      p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // -------------------
  // Handle hold order
  // -------------------
  const handleHoldOrder = (e) => {
    e.preventDefault();
    if (!selectedProductId || !customerName) return;

    const qty = parseInt(quantity);
    if (qty <= 0) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product || !product.price) return;

    onHoldOrder({
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name || "Unknown",
      quantity: qty,
      totalAmount: (product.price || 0) * qty,
      customerName,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      paid: 0,
      balance: (product.price || 0) * qty,
      status: "PENDING"
    });

    // Reset form
    setSelectedProductId("");
    setQuantity("1");
    setCustomerName("");
    setNotes("");
    setProductSearch("");
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Clock size={18} /> Pending Orders
        </h2>
      </div>

      <div className="card-content">
        {/* ===================== FORM ===================== */}
        <form className="order-form" onSubmit={handleHoldOrder}>
          <h3>Hold New Order</h3>

          {/* SEARCH */}
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>

          {/* 🔹 SEARCH RESULTS */}
          {productSearch && filteredProducts.length > 0 && (
            <ul className="search-results">
              {filteredProducts.map((p) => (
                <li
                  key={p.id}
                  className={p.id === selectedProductId ? "selected" : ""}
                  onClick={() => {
                    setSelectedProductId(p.id);
                    setProductSearch(p.name || ""); // safe fallback
                  }}
                >
                  {p.name || "Unnamed"} - ksh{(p.price || 0).toFixed(2)} (Stock: {p.stock || 0})
                </li>
              ))}
            </ul>
          )}

          {/* FORM FIELDS */}
          <label>Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          <label>Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />

          <label>Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {selectedProduct && selectedProduct.price != null && (
            <div className="total-box">
              <p>Total Amount</p>
              <strong>
                ksh{((selectedProduct.price || 0) * parseInt(quantity || 0)).toFixed(2)}
              </strong>
            </div>
          )}

          <button className="btn primary" type="submit">
            <Plus size={16} /> Hold Order
          </button>
        </form>

        {/* ===================== PENDING ORDERS ===================== */}
        <div className="orders-list" style={{ marginTop: "1rem" }}>
          <div className="list-header">
            <h3>Held Orders</h3>
            <span className="badge">{pendingOrders.length}</span>
          </div>

          {pendingOrders.length === 0 ? (
            <p className="empty">No pending orders</p>
          ) : (
            pendingOrders.map((order) => {
              const product = products.find((p) => p.id === order.productId);
              const hasStock = product && product.stock >= (order.quantity || 0);

              return (
                <div className="order-item" key={order.id}>
                  <div className="order-top">
                    <div>
                      <p className="bold">{order.productName || "Unknown Product"}</p>
                      <p>Customer: {order.customerName || "Unknown"}</p>
                      <p>
                        Quantity: {order.quantity || 0} × ksh
                        {order.totalAmount && order.quantity
                          ? (order.totalAmount / order.quantity).toFixed(2)
                          : "0.00"}
                      </p>
                      {order.notes && <p className="note">Note: {order.notes}</p>}
                      <p className="time">
                        Held: {order.createdAt
                          ? new Date(order.createdAt).toLocaleString()
                          : "Unknown"}
                      </p>
                    </div>

                    <div className="amount">
                      <p>ksh{order.totalAmount ? order.totalAmount.toFixed(2) : "0.00"}</p>
                      {!hasStock && <span className="badge danger">Low Stock</span>}
                    </div>
                  </div>

                  <div className="actions">
                    <button
                      className="btn success"
                      disabled={!hasStock}
                      onClick={() => onCompleteOrder(order.id)}
                    >
                      <CheckCircle size={16} /> Complete
                    </button>

                    <button
                      className="btn danger"
                      onClick={() => onCancelOrder(order.id)}
                    >
                      <XCircle size={16} /> Cancel
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
