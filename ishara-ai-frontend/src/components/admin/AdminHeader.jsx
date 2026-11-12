import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../api/auth";

function AdminHeader({ user }) {
  const navigate = useNavigate();
  const name = user?.full_name?.trim() || user?.email || "Administrator";
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleLogout() {
    logoutUser();
    navigate("/login", { replace: true });
  }

  return (
    <header className="admin-header">
      <h3>Administration</h3>

      <div className="admin-header-account">
        <div className="admin-header-identity">
          <strong>{name}</strong>
          {user?.email && <small>{user.email}</small>}
        </div>
        <div className="admin-header-avatar" title={name} aria-hidden="true">
          {initials || "AD"}
        </div>
        <button type="button" className="admin-header-signout" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
