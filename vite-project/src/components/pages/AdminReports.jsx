import React, { useMemo } from 'react';
import { usePOS } from '../../contexts/POSContext'; // adjust path
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Package, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import '../../index.css';

export const AdminReports = ({ reportType }) => {
  // ✅ Provide default empty arrays to avoid crashes
  const { products = [], sales = [] } = usePOS();

  const paidSales = sales.filter(s => s.status === 'Paid');
  const totalRevenue = paidSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalStockValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);

  // Sales by last 7 days
  const salesByDay = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const daySales = paidSales.filter(s => s.date?.split('T')[0] === date);
      const revenue = daySales.reduce((sum, s) => sum + (s.total || 0), 0);
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: daySales.length,
        revenue: parseFloat(revenue.toFixed(2))
      };
    });
  }, [paidSales]);

  // Products by category
  const productsByCategory = useMemo(() => {
    const categories = [...new Set(products.map(p => p.category || 'Uncategorized'))];
    return categories.map(cat => {
      const catProducts = products.filter(p => p.category === cat);
      return {
        category: cat,
        count: catProducts.length,
        stock: catProducts.reduce((sum, p) => sum + (p.stock || 0), 0),
        value: catProducts.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0)
      };
    });
  }, [products]);

  // Top selling products
  const topProducts = useMemo(() => {
    const productSales = new Map();
    paidSales.forEach(sale => {
      sale.items?.forEach(item => {
        const existing = productSales.get(item.productId) || { name: item.productName, quantity: 0, revenue: 0 };
        productSales.set(item.productId, {
          name: item.productName,
          quantity: existing.quantity + (item.quantity || 0),
          revenue: existing.revenue + (item.price || 0) * (item.quantity || 0)
        });
      });
    });

    return Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [paidSales]);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="page-container">
      <h1 className="page-title">
        {reportType === 'total-goods' ? 'Total Goods Report' : reportType === 'total-sales' ? 'Total Sales Report' : 'Stock Value Report'}
      </h1>
      <p className="page-subtitle">
        {reportType === 'total-goods'
          ? 'Overview of all products and inventory statistics'
          : reportType === 'total-sales'
          ? 'Sales performance and revenue analytics'
          : 'Inventory value and financial overview'}
      </p>

      {/* -- The rest of your charts and cards remain unchanged -- */}
      {/* Just make sure every access to product.price, product.stock, sale.total, or sale.items uses optional chaining or default values */}
    </div>
  );
};
