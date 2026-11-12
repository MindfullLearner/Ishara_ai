import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import "./AdminLayout.css";

function AdminLayout({ user }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader user={user} />

        <main className="admin-content">
          <Outlet context={user} />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
