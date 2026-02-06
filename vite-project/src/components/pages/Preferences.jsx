import React, { useState } from 'react';
import { SlidersHorizontal, Save } from 'lucide-react';
import { usePOS } from "../../contexts/POSContext";
import { toast } from 'sonner';
import '../../index.css';

const Preferences = () => {
  // Provide a safe default in case lowStockThreshold is undefined
  const { lowStockThreshold = 5, setLowStockThreshold } = usePOS();
  const [threshold, setThreshold] = useState(lowStockThreshold.toString());

  const handleSave = (e) => {
    e.preventDefault();
    const newThreshold = parseInt(threshold, 10);

    if (isNaN(newThreshold) || newThreshold < 0) {
      toast.error('Please enter a valid threshold');
      return;
    }

    setLowStockThreshold(newThreshold);
    toast.success('Preferences saved successfully!');
  };

  return (
    <div className="preferences-container">
      <header className="page-header">
        <h1>System Preferences</h1>
        <p>Configure system settings and preferences</p>
      </header>

      {/* Inventory Settings */}
      <div className="card">
        <div className="card-header">
          <h2>
            <SlidersHorizontal size={18} />
            Inventory Settings
          </h2>
        </div>

        <div className="card-body">
          <form onSubmit={handleSave} className="form">
            <label>
              Low Stock Alert Threshold
              <input
                type="number"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                required
              />
            </label>

            <p className="help-text">
              Products with stock at or below this number will be flagged as low stock
            </p>

            <div className="info-box">
              <strong>Current Setting:</strong> Products with {lowStockThreshold} or fewer
              units will appear in Low Stock alerts
            </div>

            <button type="submit" className="primary-btn">
              <Save size={16} />
              Save Preferences
            </button>
          </form>
        </div>
      </div>

      {/* System Info */}
      <div className="card">
        <div className="card-header">
          <h2>System Information</h2>
        </div>

        <div className="card-body">
          <div className="info-grid">
            <div>
              <span>System Version</span>
              <strong>POS v1.0.0</strong>
            </div>
            <div>
              <span>Data Storage</span>
              <strong>Local Storage</strong>
            </div>
          </div>

          <div className="divider" />

          <h4>Additional Features (Coming Soon):</h4>
          <ul className="features-list">
            <li>Tax rate configuration</li>
            <li>Receipt customization</li>
            <li>Currency settings</li>
            <li>Backup and restore</li>
            <li>Data export options</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
