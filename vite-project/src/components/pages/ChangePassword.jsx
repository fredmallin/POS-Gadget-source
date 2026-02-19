import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import "../../index.css";

const ChangePassword = () => {
  const { changePassword, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const firstLoginUsername = location.state?.username;

  useEffect(() => {
    // Redirect to login if user not logged in
    if (!user && !firstLoginUsername) {
      navigate("/login");
    }
  }, [user, firstLoginUsername, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!firstLoginUsername && !formData.oldPassword) {
      setError("Current password is required");
      return;
    }

    if (!formData.newPassword) {
      setError("New password is required");
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

    setLoading(true);

    try {
      // Send empty string if first-login (old password not required)
      const oldPasswordToSend = formData.oldPassword || "";

      const result = await changePassword(oldPasswordToSend, formData.newPassword);

      if (result.success) {
        toast.success(result.message || "Password updated successfully!");

        // Reset form
        setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });

        // Redirect after password change
        navigate("/dashboard");
      } else {
        setError(result.message || "Current password is incorrect");
      }
    } catch (err) {
      console.error("Change password error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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
            <strong>Current User:</strong> {user?.username || firstLoginUsername}
          </div>

          <form onSubmit={handleSubmit}>
            {!firstLoginUsername && (
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
            )}

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
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder="Re-enter new password"
                required
              />
            </div>

            {error && <div className="error-box">{error}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              <CheckCircle size={16} />
              {loading ? "Updating..." : "Update Password"}
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
