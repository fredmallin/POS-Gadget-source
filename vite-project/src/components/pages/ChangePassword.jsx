import React, { useState, useEffect } from "react";
import { usePOS } from "../../contexts/POSContext"; // usePOS for dashboard password
import { useAuth } from "../../contexts/AuthContext"; // Auth for login password
import { Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import "../../index.css";

const ChangePassword = () => {
  const { changePassword: changeLoginPassword, user: authUser } = useAuth();
  const { changeDashboardPassword, user: posUser, token } = usePOS();

  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login"); // "login" or "dashboard"
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const firstLoginUsername = location.state?.username;

  useEffect(() => {
    if (!authUser && !firstLoginUsername) {
      navigate("/login");
    }
  }, [authUser, firstLoginUsername, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
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
    if (mode === "login" && !firstLoginUsername && !formData.oldPassword) {
      setError("Current password is required for login password");
      return;
    }

    setLoading(true);

    try {
      let result;

      if (mode === "login") {
        const oldPasswordToSend = formData.oldPassword || "";
        result = await changeLoginPassword(oldPasswordToSend, formData.newPassword);
      } else if (mode === "dashboard") {
        if (!token) {
          setError("Dashboard session expired");
          setLoading(false);
          return;
        }
        // oldPassword can be empty for first-time setup
        result = await changeDashboardPassword(formData.oldPassword, formData.newPassword);
      }

      if (result.success) {
        toast.success(result.message || "Password updated successfully!");
        setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setError(result.error || "Password change failed");
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
        <p>Update your account or dashboard password</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>
            <Lock size={18} /> Password Settings
          </h2>
        </div>

        <div className="card-content">
          <div className="user-info">
            <strong>Current User:</strong> {authUser?.username || firstLoginUsername}
          </div>

          <div className="mode-switch">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Login Password
            </button>
            <button
              className={mode === "dashboard" ? "active" : ""}
              onClick={() => setMode("dashboard")}
            >
              Dashboard Password
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Only require old password if updating login password */}
            {mode === "login" && !firstLoginUsername && (
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

            {mode === "dashboard" && (
              <div className="form-group">
                <label>Current Dashboard Password</label>
                <input
                  type="password"
                  value={formData.oldPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, oldPassword: e.target.value })
                  }
                  placeholder="Leave empty if first time"
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