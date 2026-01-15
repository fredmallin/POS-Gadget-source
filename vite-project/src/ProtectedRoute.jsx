import React from "react";

export function ProtectedRoute({ isAdmin, children }) {
  if (!isAdmin) {
    return (
      <div className="access-denied">
        <h2>🚫 Access Denied</h2>
        <p>Admin privileges required.</p>
      </div>
    );
  }

  return children;
}
