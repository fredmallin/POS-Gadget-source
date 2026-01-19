import React, { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Trash2, Clock } from "lucide-react";
import "../index.css";

export function ReportsAnalytics({ products, sales, setSales }) {
  const [showConfirm, setShowConfirm] = useState(false);

  /* =========================
     CLEAR ALL DATA
  ========================== */
  const clearAllData = () => {
    localStorage.removeItem("sales");
    setSales([]);
    setShowConfirm(false);
  };

  /* =========================
     ANALYTICS
  ========================== */
  const analytics = useMemo(() => {
    const completedSales = sales.filter((sale) => sale.status === "COMPLETED");

    /* SOLD GOODS (each sale entry) */
    const soldGoods = completedSales.slice().reverse(); // newest first

    /* SALES PER PRODUCT */
    const salesByProduct = completedSales.reduce((acc, sale) => {
      if (!acc[sale.productId]) {
        acc[sale.productId] = {
          productName: sale.productName || "Unknown",
          quantitySold: 0,
          revenue: 0,
        };
      }

      acc[sale.productId].quantitySold += sale.quantity ?? 0;
      acc[sale.productId].revenue += sale.totalAmount ?? 0;
      return acc;
    }, {});

    const salesArray = Object.entries(salesByProduct).map(([productId, data]) => ({
      productId,
      ...data,
    }));

    salesArray.sort((a, b) => b.quantitySold - a.quantitySold);

    const mostSold = salesArray.slice(0, 5);
    const leastSold = salesArray.length > 5 ? salesArray.slice(-5).reverse() : [];

    const totalRevenue = completedSales.reduce((sum, sale) => sum + (sale.totalAmount ?? 0), 0);
    const totalItemsSold = completedSales.reduce((sum, sale) => sum + (sale.quantity ?? 0), 0);

    return {
      soldGoods,
      mostSold,
      leastSold,
      totalRevenue,
      totalItemsSold,
      hasSales: completedSales.length > 0,
    };
  }, [sales]);

  /* =========================
     DATE FORMATTER
  ========================== */
  const formatDate = (date) =>
    new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  /* =========================
     SAFE TOFIX HELPER
  ========================== */
  const safeToFixed = (num, decimals = 2) => (num ?? 0).toFixed(decimals);

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
            <p>This action cannot be undone.</p>
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
            <p className="stat-value">ksh{safeToFixed(analytics.totalRevenue)}</p>
          </div>

          <div className="stat-box total-items">
            <TrendingUp className="icon stat-icon" />
            <p>Items Sold</p>
            <p className="stat-value">{analytics.totalItemsSold}</p>
          </div>
        </div>

        {!analytics.hasSales ? (
          <div className="no-sales">
            <TrendingUp className="icon no-sales-icon" />
            <p>No completed sales yet</p>
            <p className="text-muted">Pending orders are not counted as sales</p>
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
                      <p className="product-name">{sale.productName ?? "Unknown"}</p>
                      <p className="product-details">
                        Qty: {sale.quantity ?? 0} · {formatDate(sale.createdAt)}
                      </p>
                    </div>
                    <p className="product-value">
                      ksh{safeToFixed(sale.totalAmount)}
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
                      <p className="product-details">Sold: {item.quantitySold} units</p>
                    </div>
                    <p className="product-value">ksh{safeToFixed(item.revenue)}</p>
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
                      <p className="product-details">Sold: {item.quantitySold} units</p>
                    </div>
                    <p className="product-value">ksh{safeToFixed(item.revenue)}</p>
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
