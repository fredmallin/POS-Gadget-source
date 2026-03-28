import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, LogIn, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import "../../index.css";

const getStrength = (pw) => {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: 20, label: "Weak", color: "#E24B4A" };
  if (s <= 2) return { score: 45, label: "Fair", color: "#EF9F27" };
  if (s <= 3) return { score: 70, label: "Good", color: "#639922" };
  return { score: 100, label: "Strong", color: "#1D9E75" };
};

const EyeToggle = ({ show, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    tabIndex={-1}
    style={{
      position: "absolute",
      right: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--color-text-secondary, #888)",
      display: "flex",
      alignItems: "center",
      padding: "4px",
    }}
  >
    {show ? <EyeOff size={15} /> : <Eye size={15} />}
  </button>
);

const MODES = [
  {
    key: "login",
    label: "Login password",
    description: "Used to sign in to your account",
    icon: LogIn,
    note: "You'll be signed out after changing this.",
  },
  {
    key: "dashboard",
    label: "Dashboard password",
    description: "Used to unlock the dashboard",
    icon: LayoutDashboard,
    note: "Takes effect immediately — no sign-out needed.",
  },
];

const ChangePassword = () => {
  const { changeLoginPassword, changeDashboardPassword } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState(null); // "login" | "dashboard"
  const [formData, setFormData] = useState({ current: "", newPw: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, newPw: false, confirm: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = getStrength(formData.newPw);
  const passwordsMatch = formData.confirm && formData.newPw === formData.confirm;
  const passwordsMismatch = formData.confirm && formData.newPw !== formData.confirm;
  const isValid =
    formData.current &&
    formData.newPw.length >= 6 &&
    formData.newPw === formData.confirm &&
    formData.current !== formData.newPw;

  const handleChange = (field) => (e) => {
    setFormData((p) => ({ ...p, [field]: e.target.value }));
    setError("");
    setSuccess(false);
  };

  const toggleShow = (field) => () => setShowPass((p) => ({ ...p, [field]: !p[field] }));

  const resetForm = () => {
    setFormData({ current: "", newPw: "", confirm: "" });
    setError("");
    setSuccess(false);
  };

  const selectMode = (key) => {
    setMode(key);
    resetForm();
  };

  const handleSubmit = async () => {
    setError("");

    if (!formData.current) return setError("Current password is required.");
    if (formData.newPw.length < 6) return setError("New password must be at least 6 characters.");
    if (formData.newPw !== formData.confirm) return setError("Passwords do not match.");
    if (formData.current === formData.newPw)
      return setError("New password must differ from the current one.");

    setLoading(true);

    const fn = mode === "login" ? changeLoginPassword : changeDashboardPassword;
    const result = await fn(formData.current, formData.newPw);

    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      if (mode === "login") {
        // Signed out by AuthContext — redirect to login
        navigate("/login");
      } else {
        setSuccess(true);
        setFormData({ current: "", newPw: "", confirm: "" });
      }
    } else {
      setError(result.message || "Something went wrong.");
    }
  };

  const selectedMode = MODES.find((m) => m.key === mode);

  return (
    <div className="change-password-container">
      <div className="page-header">
        <h1>Change Password</h1>
        <p>Choose which password you want to update</p>
      </div>

      {/* ── Step 1: pick which password ─────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "1.5rem",
        }}
      >
        {MODES.map(({ key, label, description, icon: Icon }) => {
          const active = mode === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => selectMode(key)}
              style={{
                background: active
                  ? "var(--color-background-info, #e6f1fb)"
                  : "var(--color-background-primary, #fff)",
                border: active
                  ? "2px solid var(--color-border-info, #378add)"
                  : "0.5px solid var(--color-border-tertiary, #ddd)",
                borderRadius: "12px",
                padding: "1rem 1.25rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "border 0.15s, background 0.15s",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: active
                    ? "var(--color-background-primary, #fff)"
                    : "var(--color-background-secondary, #f5f5f5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "10px",
                }}
              >
                <Icon
                  size={16}
                  color={
                    active
                      ? "var(--color-text-info, #185fa5)"
                      : "var(--color-text-secondary, #888)"
                  }
                />
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: active
                    ? "var(--color-text-info, #185fa5)"
                    : "var(--color-text-primary, #111)",
                  marginBottom: "3px",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: active
                    ? "var(--color-text-info, #185fa5)"
                    : "var(--color-text-secondary, #888)",
                }}
              >
                {description}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Step 2: form (only shown after picking a mode) ───────────────── */}
      {mode && (
        <div
          style={{
            background: "var(--color-background-primary, #fff)",
            border: "0.5px solid var(--color-border-tertiary, #ddd)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {/* Card header */}
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "0.5px solid var(--color-border-tertiary, #ddd)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--color-background-secondary, #f5f5f5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Lock size={15} color="var(--color-text-secondary, #888)" />
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 500 }}>
                Update {selectedMode.label}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-secondary, #888)",
                  marginTop: "1px",
                }}
              >
                {selectedMode.note}
              </div>
            </div>
          </div>

          {/* Fields */}
          <div
            style={{
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* Current password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", color: "var(--color-text-secondary, #888)" }}>
                Current {selectedMode.label}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass.current ? "text" : "password"}
                  value={formData.current}
                  onChange={handleChange("current")}
                  placeholder={`Enter current ${selectedMode.label.toLowerCase()}`}
                  style={{ width: "100%", paddingRight: "40px", fontSize: "14px" }}
                />
                <EyeToggle show={showPass.current} onToggle={toggleShow("current")} />
              </div>
            </div>

            {/* New password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", color: "var(--color-text-secondary, #888)" }}>
                New password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass.newPw ? "text" : "password"}
                  value={formData.newPw}
                  onChange={handleChange("newPw")}
                  placeholder="Enter new password"
                  style={{ width: "100%", paddingRight: "40px", fontSize: "14px" }}
                />
                <EyeToggle show={showPass.newPw} onToggle={toggleShow("newPw")} />
              </div>
              {formData.newPw && (
                <>
                  <div
                    style={{
                      height: "3px",
                      background: "var(--color-background-secondary, #f0f0f0)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${strength.score}%`,
                        background: strength.color,
                        borderRadius: "2px",
                        transition: "width 0.3s, background 0.3s",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "11px", color: strength.color }}>
                    {strength.label}
                  </span>
                </>
              )}
            </div>

            {/* Confirm password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", color: "var(--color-text-secondary, #888)" }}>
                Confirm new password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass.confirm ? "text" : "password"}
                  value={formData.confirm}
                  onChange={handleChange("confirm")}
                  placeholder="Confirm new password"
                  style={{ width: "100%", paddingRight: "40px", fontSize: "14px" }}
                />
                <EyeToggle show={showPass.confirm} onToggle={toggleShow("confirm")} />
              </div>
              {passwordsMatch && (
                <span style={{ fontSize: "11px", color: "#1D9E75" }}>Passwords match</span>
              )}
              {passwordsMismatch && (
                <span style={{ fontSize: "11px", color: "#E24B4A" }}>Passwords do not match</span>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "var(--color-background-danger, #fff0f0)",
                  border: "0.5px solid var(--color-border-danger, #f5c1c1)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "13px",
                  color: "var(--color-text-danger, #A32D2D)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div
                style={{
                  background: "var(--color-background-success, #eaf3de)",
                  border: "0.5px solid var(--color-border-success, #c0dd97)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "13px",
                  color: "var(--color-text-success, #3B6D11)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle size={14} />
                Dashboard password updated successfully!
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "0 1.25rem 1.25rem" }}>
            <button
              onClick={handleSubmit}
              disabled={!isValid || loading}
              style={{
                width: "100%",
                padding: "9px",
                fontSize: "14px",
                fontWeight: 500,
                background:
                  isValid && !loading
                    ? "var(--color-text-primary, #111)"
                    : "var(--color-background-secondary, #e0e0e0)",
                color:
                  isValid && !loading
                    ? "var(--color-background-primary, #fff)"
                    : "var(--color-text-tertiary, #aaa)",
                border: "none",
                borderRadius: "8px",
                cursor: isValid && !loading ? "pointer" : "not-allowed",
                transition: "opacity 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Lock size={14} />
              {loading ? "Updating..." : `Update ${selectedMode.label}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangePassword;
