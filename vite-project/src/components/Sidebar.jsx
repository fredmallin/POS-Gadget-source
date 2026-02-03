import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="logo">POS</h2>

      <nav className="menu">
        <NavLink to="/sales">Sales</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/reports">Reports</NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
