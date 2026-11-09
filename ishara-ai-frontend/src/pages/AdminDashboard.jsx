
import { useState } from "react";
import "./AdminDashboard.css";

const navigationItems = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "dictionary", label: "PSL Dictionary" },
  { id: "knowledge", label: "Knowledge Base" },
  { id: "logs", label: "System Logs" },
  { id: "processing", label: "Processing Activity" },
  { id: "settings", label: "Profile & Settings" },
];

const statistics = [
  {
    title: "Total users",
    value: "2,480",
    detail: "↑ 12% this month",
    icon: "♙",
  },
  {
    title: "Translations",
    value: "8,432",
    detail: "↑ 18% this month",
    icon: "↔",
  },
  {
    title: "Active today",
    value: "186",
    detail: "Across all users",
    icon: "◉",
  },
  {
    title: "System health",
    value: "99.8%",
    detail: "Operational",
    icon: "✓",
  },
];

const recentActivities = [
  {
    title: "New user registration",
    time: "10:42 AM",
    status: "Completed",
  },
  {
    title: "PSL dictionary entry updated",
    time: "10:25 AM",
    status: "Completed",
  },
  {
    title: "Translation completed",
    time: "09:50 AM",
    status: "Completed",
  },
  {
    title: "Knowledge article published",
    time: "Yesterday",
    status: "Completed",
  },
];

function AdminDashboard() {
  const [activePage, setActivePage] = useState("overview");

  function handleNavigation(item) {
    setActivePage(item.id);
  }

  return (
    <main className="admin-layout">

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <h2>ishara.ai</h2>
          <span>ADMIN</span>
        </div>

        <nav className="admin-navigation" aria-label="Admin navigation">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-nav-item ${
                activePage === item.id ? "active" : ""
              }`}
              onClick={() => handleNavigation(item)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <span className="admin-sidebar-dot" />
          Administration Panel
        </div>
      </aside>

      {/* Main content */}
      <section className="admin-main">

        {/* Topbar */}
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-title">
              Administration
            </span>
          </div>

          <div className="admin-topbar-right">
            <button
              type="button"
              className="admin-notification-button"
              aria-label="Notifications"
            >
              ♧
            </button>

            <button
              type="button"
              className="admin-avatar"
              aria-label="Admin profile"
            >
              AD
            </button>
          </div>
        </header>

        {/* Dashboard content */}
        <div className="admin-content">

          <div className="admin-page-heading">
            <h1>System overview</h1>
            <p>
              Monitor platform activity, content and translation
              operations.
            </p>
          </div>

          {/* Statistics */}
          <section className="admin-stats-grid">
            {statistics.map((stat) => (
              <article className="admin-stat-card" key={stat.title}>
                <div className="admin-stat-top">
                  <span className="admin-stat-title">
                    {stat.title}
                  </span>
                  <span className="admin-stat-icon">
                    {stat.icon}
                  </span>
                </div>

                <h2>{stat.value}</h2>

                <p
                  className={
                    stat.title === "System health"
                      ? "admin-stat-success"
                      : "admin-stat-detail"
                  }
                >
                  {stat.detail}
                </p>
              </article>
            ))}
          </section>

          {/* Activity and system status */}
          <section className="admin-information-grid">

            <article className="admin-panel admin-activity-panel">
              <div className="admin-panel-heading">
                <div>
                  <h3>Recent activity</h3>
                  <p>Latest platform updates</p>
                </div>

                <button
                  type="button"
                  className="admin-view-all"
                  onClick={() => setActivePage("logs")}
                >
                  View all
                </button>
              </div>

              <div className="admin-activity-list">
                {recentActivities.map((activity, index) => (
                  <div
                    className="admin-activity-item"
                    key={index}
                  >
                    <div className="admin-activity-indicator" />

                    <div className="admin-activity-details">
                      <strong>{activity.title}</strong>
                      <span>{activity.time}</span>
                    </div>

                    <span className="admin-activity-status">
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-panel admin-status-panel">
              <div className="admin-panel-heading">
                <div>
                  <h3>System status</h3>
                  <p>Current service health</p>
                </div>

                <span className="admin-operational-badge">
                  ● Live
                </span>
              </div>

              <div className="admin-service-list">
                {[
                  "Translation API",
                  "PSL Dictionary",
                  "Video processing",
                  "Database connection",
                ].map((service) => (
                  <div
                    className="admin-service-item"
                    key={service}
                  >
                    <span>{service}</span>
                    <span className="admin-service-status">
                      <span /> Operational
                    </span>
                  </div>
                ))}
              </div>
            </article>

          </section>

          {/* Quick actions */}
          <section className="admin-panel admin-quick-panel">
            <div className="admin-panel-heading">
              <div>
                <h3>Admin quick actions</h3>
                <p>Frequently used administrative tasks</p>
              </div>
            </div>

            <div className="admin-quick-actions">
              <button
                type="button"
                onClick={() => setActivePage("users")}
              >
                <span>♙</span>
                Manage users
                <span className="admin-action-arrow">→</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePage("dictionary")}
              >
                <span>＋</span>
                Add a PSL sign
                <span className="admin-action-arrow">→</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePage("knowledge")}
              >
                <span>✎</span>
                Edit knowledge articles
                <span className="admin-action-arrow">→</span>
              </button>
            </div>
          </section>

          <footer className="admin-footer">
            ISHARA AI Administration Panel
            <span>© 2026 ISHARA AI</span>
          </footer>

        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;
