import React, { useState } from "react";
import { usePOS } from "../../contexts/POSContext";
import "../../index.css";

export default function AllSales() {
  const { sales } = usePOS();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const paidSales = sales.filter((s) => String(s.status || "").toLowerCase() === "paid");

const filteredSales = paidSales
  .filter((sale) => {
    const name = String(sale.userName || "").toLowerCase();
    const method = String(sale.paymentMethod || "").toLowerCase();
    const itemsMatch =
      Array.isArray(sale.items) &&
      sale.items.some((item) =>
        String(item.productName || "").toLowerCase().includes(searchTerm.toLowerCase())
      );

    return (
      name.includes(searchTerm.toLowerCase()) ||
      method.includes(searchTerm.toLowerCase()) ||
      itemsMatch
    );
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date));


  const totalRevenue = paidSales.reduce((sum, sale) => sum + (sale.total || 0), 0);

  const openModal = (sale) => setSelectedSale(sale);
  const closeModal = () => setSelectedSale(null);

  const formatItems = (items = []) => {
    return items
      .map((item) => `${item.productName || "Item"} (${item.quantity || 0})`)
      .join(", ");
  };

  return (
    <div className="allsales-container">
      <h1>All Sales</h1>
      <p>View and search all completed sales</p>

      <input
        type="text"
        placeholder="Search sales..."
        className="search-box"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <table className="sales-table">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Cashier</th>
            <th>Items</th>
            <th>Payment Method</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSales.length === 0 && (
            <tr>
              <td colSpan="6" className="no-sales">
                No sales found
              </td>
            </tr>
          )}

          {filteredSales.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.date ? new Date(sale.date).toLocaleString() : "N/A"}</td>
              <td>{sale.userName || "Unknown"}</td>
              <td>{formatItems(sale.items)}</td>
              <td>{sale.paymentMethod || "N/A"}</td>
              <td>${(sale.total || 0).toFixed(2)}</td>
              <td>
                <button onClick={() => openModal(sale)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedSale && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              &times;
            </button>

            <h2>Sale Details</h2>
            <p>
              <strong>Sale ID:</strong> {selectedSale.id || "N/A"}
            </p>
            <p>
              <strong>Date & Time:</strong>{" "}
              {selectedSale.date ? new Date(selectedSale.date).toLocaleString() : "N/A"}
            </p>
            <p>
              <strong>Cashier:</strong> {selectedSale.userName || "Unknown"}
            </p>
            <p>
              <strong>Payment Method:</strong> {selectedSale.paymentMethod || "N/A"}
            </p>

            <h3>Items</h3>
            <div className="modal-items">
              {Array.isArray(selectedSale.items) && selectedSale.items.length > 0 ? (
                selectedSale.items.map((item, idx) => (
                  <div key={idx} className="modal-item">
                    <span>{item.productName || "Item"}</span>
                    <span>
                      ${Number(item.price || 0).toFixed(2)} × {item.quantity || 0}
                    </span>
                    <span>${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p>No items</p>
              )}
            </div>

            <div className="modal-total">
              <strong>Total: ksh{Number(selectedSale.total || 0).toFixed(2)}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
