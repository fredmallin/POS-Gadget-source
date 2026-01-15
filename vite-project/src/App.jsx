import { useState } from "react";
import Dashboard from "./components/Dashboard";
import { AdminLogin } from "./AdminLogin";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <Dashboard
        isAdmin={isAdmin}
        onRequestAdmin={() => setShowLogin(true)}
        onLogoutAdmin={() => setIsAdmin(false)}
      />

      {showLogin && (
        <AdminLogin
          setIsAdmin={(value) => {
            setIsAdmin(value);
            setShowLogin(false);
          }}
        />
      )}
    </>
  );
}

export default App;
