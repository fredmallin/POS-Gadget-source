import React, { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Trash2, Clock } from "lucide-react";
import { ref, remove } from "firebase/database";
import { db } from "../firebase";
import "../index.css";

export function ReportsAnalytics({ sales = [], setSales }) {
  const [showConfirm, setShowConfirm] = useState(false);

  /* =========================
     CLEAR ALL SALES (Firebase)
  ========================== */
  const clearAllData = async () => {
    try {
      const salesRef = ref(db, "sales");
      await remove(salesRef);

      if (typeof setSales === "function") {
        setSales([]);
      }

      setShowConfirm(false);
      alert("All sales cleared successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to clear sales");
    }
  };

  /* =========================
     ANALYTICS
  ========================== */
  const analytics = useMemo(() => {
    const validSales = sales || [];

    const soldGoods = [...validSales].reverse();

    const salesByProduct = validSales.reduce((acc, sale) => {
      const productId = sale.productId || "unknown";

      if (!acc[productId]) {
        acc[productId] = {
          productName: sale.name || "Unknown",
          quantitySold: 0,
          revenue: 0,
        };
      }

      acc[productId].quantitySold += sale.quantity || 0;
      acc[productId].revenue += (sale.price || 0) * (sale.quantity || 0);

      return acc;
    }, {});

    const salesArray = Object.entries(salesByProduct).map(
      ([productId, data]) => ({
        productId,
        ...data,
      })
    );

    salesArray.sort((a, b) => b.quantitySold - a.quantitySold);

    const totalRevenue = validSales.reduce(
      (sum, sale) => sum + (sale.price || 0) * (sale.quantity || 0),
      0
    );

    const totalItemsSold = validSales.reduce(
      (sum, sale) => sum + (sale.quantity || 0),
      0
    );

    return {
      soldGoods,
      mostSold: salesArray.slice(0, 5),
      leastSold:
        salesArray.length > 5
          ? salesArray.slice(-5).reverse()
          : [],
      totalRevenue,
      totalItemsSold,
      hasSales: validSales.length > 0,
    };
  }, [sales]);

  /* =========================
     HELPERS
  ========================== */
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("en-KE", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Unknown";

  const safeToFixed = (num, decimals = 2) =>
    Number(num || 0).toFixed(decimals);

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="card">
      {/* HEADER */}
      <div className="card-header report-header">
        <h2 className="card-title">Reports & Analytics</h2>
        <button className="clear-btn" onClick={() => setShowConfirm(true)}>
          <Trash2 size={16} /> Clear Data
        </button>
      </div>

      {/* CONFIRM */}
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3>Clear All Sales Data?</h3>
            <p>This action is permanent and cannot be reversed.</p>
            <div className="confirm-actions">
              <button className="btn cancel" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button className="btn danger" onClick={clearAllData}>
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="card-content">
        {/* STATS */}
        <div className="grid-2 gap-4 mb-6">
          <div className="stat-box total-revenue">
            <span className="icon stat-icon">KSh</span>
            <p>Total Revenue</p>
            <p className="stat-value">
              ksh{safeToFixed(analytics.totalRevenue)}
            </p>
          </div>

          <div className="stat-box total-items">
            <TrendingUp className="icon stat-icon" />
            <p>Items Sold</p>
            <p className="stat-value">{analytics.totalItemsSold}</p>
          </div>
        </div>

        {/* NO SALES */}
        {!analytics.hasSales ? (
          <div className="no-sales">
            <TrendingUp className="icon no-sales-icon" />
            <p>No sales recorded yet</p>
          </div>
        ) : (
          <>
            {/* SOLD GOODS */}
            <div className="analytics-section">
              <div className="section-header">
                <Clock className="icon" />
                <h3>Sold Goods</h3>
              </div>

              <div className="sold-goods-list scrollable">
                {analytics.soldGoods.map((sale, index) => (
                  <div key={index} className="analytics-item">
                    <div>
                      <p className="product-name">{sale.name}</p>
                      <p className="product-details">
                        Qty: {sale.quantity} · {formatDate(sale.date)}
                      </p>
                    </div>
                    <p className="product-value">
                      ksh{safeToFixed(sale.price * sale.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* MOST SOLD */}
            {analytics.mostSold.length > 0 && (
              <div className="analytics-section">
                <div className="section-header">
                  <TrendingUp className="icon trending-up" />
                  <h3>Most Sold Products</h3>
                </div>
                {analytics.mostSold.map((item) => (
                  <div key={item.productId} className="analytics-item most-sold">
                    <div>
                      <p className="product-name">{item.productName}</p>
                      <p className="product-details">
                        Sold: {item.quantitySold} units
                      </p>
                    </div>
                    <p className="product-value">
                      ksh{safeToFixed(item.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* LEAST SOLD */}
            {analytics.leastSold.length > 0 && (
              <div className="analytics-section">
                <div className="section-header">
                  <TrendingDown className="icon trending-down" />
                  <h3>Least Sold Products</h3>
                </div>
                {analytics.leastSold.map((item) => (
                  <div key={item.productId} className="analytics-item least-sold">
                    <div>
                      <p className="product-name">{item.productName}</p>
                      <p className="product-details">
                        Sold: {item.quantitySold} units
                      </p>
                    </div>
                    <p className="product-value">
                      ksh{safeToFixed(item.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
