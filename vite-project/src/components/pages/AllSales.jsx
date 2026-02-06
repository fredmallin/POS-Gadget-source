import React, { useState } from "react";
import { usePOS } from "../../contexts/POSContext";
import "../../index.css";

export default function AllSales() {
  const { sales } = usePOS();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);

  const paidSales = sales.filter((s) => s.status === "Paid");

  const filteredSales = paidSales.filter(
    (sale) =>
      sale.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.items.some((item) =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const totalRevenue = paidSales.reduce((sum, sale) => sum + sale.total, 0);

  const openModal = (sale) => setSelectedSale(sale);
  const closeModal = () => setSelectedSale(null);

  return (
    <div className="allsales-container">
      <h1>All Sales</h1>
      <p>View and search all completed sales</p>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <p>Total Sales</p>
          <h2>{paidSales.length}</h2>
        </div>
        <div className="card">
          <p>Total Revenue</p>
          <h2>${totalRevenue.toFixed(2)}</h2>
        </div>
        <div className="card">
          <p>Average Sale</p>
          <h2>
            ${paidSales.length > 0 ? (totalRevenue / paidSales.length).toFixed(2) : "0.00"}
          </h2>
        </div>
      </div>

      {/* Search Box */}
      <input
        type="text"
        placeholder="Search sales..."
        className="search-box"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Sales Table */}
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
              <td>{new Date(sale.date).toLocaleString()}</td>
              <td>{sale.userName}</td>
              <td>{sale.items.length} item(s)</td>
              <td>{sale.paymentMethod}</td>
              <td>${sale.total.toFixed(2)}</td>
              <td>
                <button onClick={() => openModal(sale)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {selectedSale && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button className="modal-close" onClick={closeModal}>
              &times;
            </button>

            <h2>Sale Details</h2>
            <p>
              <strong>Sale ID:</strong> {selectedSale.id}
            </p>
            <p>
              <strong>Date & Time:</strong> {new Date(selectedSale.date).toLocaleString()}
            </p>
            <p>
              <strong>Cashier:</strong> {selectedSale.userName}
            </p>
            <p>
              <strong>Payment Method:</strong> {selectedSale.paymentMethod}
            </p>

            <h3>Items</h3>
            <div className="modal-items">
              {selectedSale.items.map((item, idx) => (
                <div key={idx} className="modal-item">
                  <span>{item.productName}</span>
                  <span>${item.price.toFixed(2)} × {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="modal-total">
              <strong>Total: ${selectedSale.total.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
