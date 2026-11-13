
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminDemoNotice from "../components/admin/AdminDemoNotice";
import {
  getDashboardSummary,
  getSystemLogs,
} from "../api/admin";
import "./AdminDashboard.css";

function formatLogTime(timestamp) {
  if (!timestamp) return "Time unavailable";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return date.toLocaleString();
}

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState("");
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const data = await getDashboardSummary();

        if (isMounted) {
          setSummary(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.message || "Unable to load dashboard statistics."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    async function fetchRecentActivity() {
      try {
        setActivityLoading(true);
        setActivityError("");

        const data = await getSystemLogs();

        if (isMounted) {
          const logs = Array.isArray(data)
            ? data
            : data?.logs ?? [];

          setActivities(logs.slice(0, 5));
        }
      } catch (err) {
        if (isMounted) {
          setActivityError(
            err.message || "Unable to load recent activity."
          );
        }
      } finally {
        if (isMounted) {
          setActivityLoading(false);
        }
      }
    }

    fetchDashboardData();
    fetchRecentActivity();

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
    { name: "Recent activity logs", status: "Connected" },
    { name: "Service monitoring", status: "Not connected" },
  ];

  return (
    <div className="overview-page">
      <AdminDemoNotice>
        User statistics and recent system activity are connected to
        PostgreSQL. Other monitoring features will be integrated later.
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

            <strong className="overview-stat-value">
              {stat.value}
            </strong>

            <span className="overview-stat-note">{stat.note}</span>
          </article>
        ))}
      </section>

      {error && (
        <div className="overview-error">{error}</div>
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

          {activityLoading ? (
            <div className="overview-empty-state">
              Loading recent activity...
            </div>
          ) : activityError ? (
            <div className="overview-empty-state overview-activity-error">
              {activityError}
            </div>
          ) : activities.length === 0 ? (
            <div className="overview-empty-state">
              No system activity has been recorded yet.
            </div>
          ) : (
            <div className="overview-activity-list">
              {activities.map((activity) => (
                <div
                  className="overview-activity-item"
                  key={activity.id}
                >
                  <span
                    className={`overview-activity-dot severity-${(
                      activity.severity || "INFO"
                    ).toLowerCase()}`}
                  />

                  <div className="overview-activity-text">
                    <strong>{activity.event}</strong>
                    <span>
                      {activity.source} ·{" "}
                      {formatLogTime(activity.timestamp)}
                    </span>
                  </div>

                  <span
                    className={`overview-severity-badge severity-badge-${(
                      activity.severity || "INFO"
                    ).toLowerCase()}`}
                  >
                    {activity.severity || "INFO"}
                  </span>
                </div>
              ))}
            </div>
          )}
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

                {item.status === "Connected" ? (
                  <span className="overview-operational">
                    <i />
                    Connected
                  </span>
                ) : (
                  <span className="overview-unavailable">
                    {item.status}
                  </span>
                )}
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
