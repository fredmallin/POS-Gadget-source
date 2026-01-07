import { useState } from "react";
import { Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import "../index.css";

export function PendingSales({
  products,
  pendingOrders,
  onHoldOrder,
  onCompleteOrder,
  onCancelOrder
}) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleHoldOrder = (e) => {
    e.preventDefault();
    if (!selectedProductId || !customerName) return;

    const qty = parseInt(quantity);
    if (qty <= 0) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    // 🔹 Create new pending order object
    onHoldOrder({
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      quantity: qty,
      totalAmount: product.price * qty,
      customerName,
      notes: notes || undefined,
      createdAt: new Date(),
      paid: 0,
      balance: product.price * qty,
      status: "PENDING"
    });

    // Reset form
    setSelectedProductId("");
    setQuantity("1");
    setCustomerName("");
    setNotes("");
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Clock size={18} />
          Pending Orders
        </h2>
      </div>

      <div className="card-content">

        {/* FORM */}
        <form className="order-form" onSubmit={handleHoldOrder}>
          <h3>Hold New Order</h3>

          <label>Product</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">Choose a product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} - ${p.price} (Stock: {p.stock})
              </option>
            ))}
          </select>

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

          {selectedProduct && (
            <div className="total-box">
              <p>Total Amount</p>
              <strong>
                ${(selectedProduct.price * parseInt(quantity || 0)).toFixed(2)}
              </strong>
            </div>
          )}

          <button className="btn primary" type="submit">
            <Plus size={16} />
            Hold Order
          </button>
        </form>

        {/* LIST */}
        <div className="orders-list">
          <div className="list-header">
            <h3>Held Orders</h3>
            <span className="badge">{pendingOrders.length}</span>
          </div>

          {pendingOrders.length === 0 ? (
            <p className="empty">No pending orders</p>
          ) : (
            pendingOrders.map(order => {
              const product = products.find(p => p.id === order.productId);
              const hasStock = product && product.stock >= order.quantity;

              return (
                <div className="order-item" key={order.id}>
                  <div className="order-top">
                    <div>
                      <p className="bold">{order.productName}</p>
                      <p>Customer: {order.customerName}</p>
                      <p>
                        Quantity: {order.quantity} × $
                        {(order.totalAmount / order.quantity).toFixed(2)}
                      </p>
                      {order.notes && <p className="note">Note: {order.notes}</p>}
                      <p className="time">
                        Held: {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="amount">
                      <p>${order.totalAmount.toFixed(2)}</p>
                      {!hasStock && <span className="badge danger">Low Stock</span>}
                    </div>
                  </div>

                  <div className="actions">
                    <button
                      className="btn success"
                      disabled={!hasStock}
                      onClick={() => onCompleteOrder(order.id)}
                    >
                      <CheckCircle size={16} />
                      Complete
                    </button>

                    <button
                      className="btn danger"
                      onClick={() => onCancelOrder(order.id)}
                    >
                      <XCircle size={16} />
                      Cancel
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
