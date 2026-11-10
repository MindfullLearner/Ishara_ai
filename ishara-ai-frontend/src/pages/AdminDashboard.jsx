import { Link } from "react-router-dom";
import "./AdminDashboard.css";

const overviewStats = [
  {
    label: "Total users",
    value: "2,480",
    note: "↑ 12% this month",
    icon: "♙",
  },
  {
    label: "Translations",
    value: "8,432",
    note: "↑ 18% this month",
    icon: "↔",
  },
  {
    label: "Active today",
    value: "186",
    note: "Across all users",
    icon: "◎",
  },
  {
    label: "System health",
    value: "99.8%",
    note: "Operational",
    icon: "✓",
    healthy: true,
  },
];

const recentActivities = [
  { title: "New user registration", time: "10:42 AM" },
  { title: "PSL dictionary entry updated", time: "10:25 AM" },
  { title: "Translation completed", time: "09:50 AM" },
  { title: "Knowledge article published", time: "Yesterday" },
];

const systemServices = [
  "Translation API",
  "PSL Dictionary",
  "Video processing",
  "Database connection",
];

function AdminDashboard() {
  return (
    <div className="overview-page">
      <div className="overview-heading">
        <h1>System overview</h1>
        <p>
          Monitor platform activity, content and translation operations.
        </p>
      </div>

      {/* Summary cards */}
      <section className="overview-stats-grid">
        {overviewStats.map((stat) => (
          <article className="overview-stat-card" key={stat.label}>
            <div className="overview-stat-top">
              <span>{stat.label}</span>
              <span className="overview-stat-icon">{stat.icon}</span>
            </div>

            <strong className="overview-stat-value">{stat.value}</strong>

            <span
              className={`overview-stat-note ${
                stat.healthy ? "healthy" : ""
              }`}
            >
              {stat.note}
            </span>
          </article>
        ))}
      </section>

      {/* Activity and system status */}
      <section className="overview-middle-grid">
        <article className="overview-panel overview-activity-panel">
          <div className="overview-panel-heading">
            <div>
              <h2>Recent activity</h2>
              <p>Latest platform updates</p>
            </div>

            <Link to="/admin/system-logs">View all</Link>
          </div>

          <div className="overview-activity-list">
            {recentActivities.map((activity) => (
              <div className="overview-activity-item" key={activity.title}>
                <span className="overview-activity-dot" />

                <div className="overview-activity-text">
                  <strong>{activity.title}</strong>
                  <span>{activity.time}</span>
                </div>

                <span className="overview-completed-badge">
                  Completed
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="overview-panel overview-system-panel">
          <div className="overview-panel-heading">
            <div>
              <h2>System status</h2>
              <p>Current service health</p>
            </div>

            <span className="overview-live-badge">
              <span /> Live
            </span>
          </div>

          <div className="overview-service-list">
            {systemServices.map((service) => (
              <div className="overview-service-item" key={service}>
                <span>{service}</span>

                <span className="overview-operational">
                  <i />
                  Operational
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Quick actions */}
      <section className="overview-panel overview-quick-actions">
        <div className="overview-panel-heading">
          <div>
            <h2>Admin quick actions</h2>
            <p>Frequently used administrative tasks</p>
          </div>
        </div>

        <div className="overview-action-list">
          <Link to="/admin/users" className="overview-action-btn">
            <span>♙</span>
            Manage users
            <span className="overview-action-arrow">→</span>
          </Link>

          <Link
            to="/admin/psl-dictionary"
            className="overview-action-btn"
          >
            <span>＋</span>
            Add a PSL sign
            <span className="overview-action-arrow">→</span>
          </Link>

          <Link
            to="/admin/knowledge-base"
            className="overview-action-btn"
          >
            <span>✎</span>
            Edit knowledge articles
            <span className="overview-action-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="overview-footer">
        <span>ISHARA AI Administration Panel</span>
        <span>© 2026 ISHARA AI</span>
      </footer>
    </div>
  );
}

export default AdminDashboard;