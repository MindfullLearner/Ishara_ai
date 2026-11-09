import { NavLink } from "react-router-dom";

function AdminSidebar() {
  const menuItems = [
    { label: "Overview", path: "/admin" },
    { label: "Users", path: "/admin/users" },
    { label: "PSL dictionary", path: "/admin/psl-dictionary" },
    { label: "Knowledge base", path: "/admin/knowledge-base" },
    { label: "System logs", path: "/admin/logs" },
    { label: "Processing activity", path: "/admin/activity" },
    { label: "Profile & settings", path: "/admin/settings" },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <h2>ishara.ai</h2>
        <span>ADMIN</span>
      </div>

      <nav className="admin-sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default AdminSidebar;