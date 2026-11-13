import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminDemoNotice from "../components/admin/AdminDemoNotice";
import { getDashboardSummary } from "../api/admin";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardSummary() {
      try {
        setLoading(true);
        setError("");

        const data = await getDashboardSummary();

        if (isMounted) {
          setSummary(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load dashboard statistics.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboardSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const overviewStats = [
    {
      label: "Total users",
      value: summary?.total_users ?? (loading ? "..." : "—"),
      note: "Registered platform users",
      icon: "♙",
    },
    {
      label: "Active users",
      value: summary?.active_users ?? (loading ? "..." : "—"),
      note: "Currently active accounts",
      icon: "◎",
    },
    {
      label: "Pending users",
      value: summary?.pending_users ?? (loading ? "..." : "—"),
      note: "Awaiting account activation",
      icon: "◷",
    },
    {
      label: "Admin users",
      value: summary?.admin_users ?? (loading ? "..." : "—"),
      note: "Administrator accounts",
      icon: "✓",
    },
  ];

  const dataAvailability = [
    { name: "Translation statistics", status: "Not connected" },
    { name: "Active today tracking", status: "Not available" },
    { name: "Recent activity logs", status: "Not connected" },
    { name: "Service monitoring", status: "Not connected" },
  ];

  return (
    <div className="overview-page">
      <AdminDemoNotice>
        User statistics are live from PostgreSQL. Translation statistics,
        activity logs and service monitoring will be connected in later stages.
      </AdminDemoNotice>

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

            <span className="overview-stat-note">{stat.note}</span>
          </article>
        ))}
      </section>

      {error && (
        <div className="overview-error">
          {error}
        </div>
      )}

      {/* Activity and data availability */}
      <section className="overview-middle-grid">
        <article className="overview-panel overview-activity-panel">
          <div className="overview-panel-heading">
            <div>
              <h2>Recent activity</h2>
              <p>Latest platform updates</p>
            </div>

            <Link to="/admin/system-logs">View all</Link>
          </div>

          <div className="overview-empty-state">
            Activity logging is not connected yet.
            Recent activities will appear here once the system log feature
            is implemented.
          </div>
        </article>

        <article className="overview-panel overview-system-panel">
          <div className="overview-panel-heading">
            <div>
              <h2>Data availability</h2>
              <p>Backend integration status</p>
            </div>
          </div>

          <div className="overview-service-list">
            {dataAvailability.map((item) => (
              <div className="overview-service-item" key={item.name}>
                <span>{item.name}</span>

                <span className="overview-unavailable">
                  {item.status}
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