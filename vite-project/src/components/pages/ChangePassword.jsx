import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import "../../index.css";

const ChangePassword = () => {
  const { changePassword } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.oldPassword) {
      setError("Current password is required");
      return;
    }
    if (formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (formData.oldPassword === formData.newPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);

    const result = await changePassword(
      formData.oldPassword,
      formData.newPassword
    );

    if (result.success) {
      toast.success("Password updated! Please login with new password.");
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      navigate("/login");
    } else {
      setError(result.message || "Password change failed");
    }

    setLoading(false);
  };

  return (
    <div className="change-password-container">
      <div className="page-header">
        <h1>Change Password</h1>
        <p>Update your login password</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2><Lock size={18} /> Password Settings</h2>
        </div>

        <div className="card-content">
          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={formData.oldPassword}
                onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                required
              />
            </div>

            {error && <div className="error-box">{error}</div>}

            <button className="submit-btn" disabled={loading}>
              <CheckCircle size={16} />
              {loading ? "Updating..." : "Update Password"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;