import React, { useState } from 'react';
import { useAuth } from "../../contexts/AuthContext";
import { Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import '../../index.css';

const ChangePassword = () => {
  const { changePassword, user } = useAuth();

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    const success = changePassword(
      formData.oldPassword,
      formData.newPassword
    );

    if (success) {
      toast.success('Password changed successfully!');
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } else {
      setError('Current password is incorrect');
    }
  };

  return (
    <div className="change-password-container">
      <div className="page-header">
        <h1>Change Password</h1>
        <p>Update your account password</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>
            <Lock size={18} /> Password Settings
          </h2>
        </div>

        <div className="card-content">
          <div className="user-info">
            <strong>Current User:</strong> {user?.name} ({user?.username})
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={formData.oldPassword}
                onChange={(e) =>
                  setFormData({ ...formData, oldPassword: e.target.value })
                }
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Re-enter new password"
                required
              />
            </div>

            {error && <div className="error-box">{error}</div>}

            <button type="submit" className="submit-btn">
              <CheckCircle size={16} />
              Update Password
            </button>
          </form>

          <div className="requirements">
            <h4>Password Requirements</h4>
            <ul>
              <li>• Minimum 6 characters</li>
              <li>• Must be different from current password</li>
              <li>• Never share your password</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
