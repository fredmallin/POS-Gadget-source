import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import "../index.css";

export function ReportsAnalytics({ products, sales }) {
  const analytics = useMemo(() => {
    /* =========================
       ONLY COMPLETED SALES
    ========================== */
    const completedSales = sales.filter(
      (sale) => sale.status === "COMPLETED"
    );

    /* =========================
       SALES PER PRODUCT
    ========================== */
    const salesByProduct = completedSales.reduce((acc, sale) => {
      if (!acc[sale.productId]) {
        acc[sale.productId] = {
          productName: sale.productName,
          quantitySold: 0,
          revenue: 0
        };
      }

      acc[sale.productId].quantitySold += sale.quantity;
      acc[sale.productId].revenue += sale.totalAmount;

      return acc;
    }, {});

    const salesArray = Object.entries(salesByProduct).map(
      ([productId, data]) => ({
        productId,
        ...data
      })
    );

    /* =========================
       SORTING
    ========================== */
    salesArray.sort((a, b) => b.quantitySold - a.quantitySold);

    const mostSold = salesArray.slice(0, 5);
    const leastSold =
      salesArray.length > 5
        ? salesArray.slice(-5).reverse()
        : [];

    /* =========================
       TOTALS
    ========================== */
    const totalRevenue = completedSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const totalItemsSold = completedSales.reduce(
      (sum, sale) => sum + sale.quantity,
      0
    );

    return {
      mostSold,
      leastSold,
      totalRevenue,
      totalItemsSold,
      hasSales: completedSales.length > 0
    };
  }, [sales]);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Reports & Analytics</h2>
      </div>

      <div className="card-content">
        <div className="grid-2 gap-4 mb-6">
          <div className="stat-box total-revenue">
            <div className="stat-header">
              <DollarSign className="icon stat-icon" />
              <p>Total Revenue</p>
            </div>
            <p className="stat-value">
              ${analytics.totalRevenue.toFixed(2)}
            </p>
          </div>

          <div className="stat-box total-items">
            <div className="stat-header">
              <TrendingUp className="icon stat-icon" />
              <p>Items Sold</p>
            </div>
            <p className="stat-value">
              {analytics.totalItemsSold}
            </p>
          </div>
        </div>

        <div className="analytics-list">
          {analytics.hasSales ? (
            <>
              {analytics.mostSold.length > 0 && (
                <div className="analytics-section">
                  <div className="section-header">
                    <TrendingUp className="icon trending-up" />
                    <h3>Most Sold Products (Top 5)</h3>
                  </div>

                  {analytics.mostSold.map((item, index) => (
                    <div
                      key={item.productId}
                      className="analytics-item most-sold"
                    >
                      <div className="analytics-item-info">
                        <div className="rank-badge">
                          {index + 1}
                        </div>
                        <div>
                          <p className="product-name">
                            {item.productName}
                          </p>
                          <p className="product-details">
                            Sold: {item.quantitySold} units
                          </p>
                        </div>
                      </div>
                      <p className="product-value">
                        ${item.revenue.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {analytics.leastSold.length > 0 && (
                <div className="analytics-section">
                  <div className="section-header">
                    <TrendingDown className="icon trending-down" />
                    <h3>Least Sold Products</h3>
                  </div>

                  {analytics.leastSold.map((item, index) => (
                    <div
                      key={item.productId}
                      className="analytics-item least-sold"
                    >
                      <div className="analytics-item-info">
                        <div className="rank-badge least">
                          {index + 1}
                        </div>
                        <div>
                          <p className="product-name least">
                            {item.productName}
                          </p>
                          <p className="product-details">
                            Sold: {item.quantitySold} units
                          </p>
                        </div>
                      </div>
                      <p className="product-value least">
                        ${item.revenue.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-sales">
              <TrendingUp className="icon no-sales-icon" />
              <p>No completed sales yet</p>
              <p className="text-muted">
                Pending orders are not counted as sales
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
