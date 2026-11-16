import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../api/auth";
import "./Dashboard.css";

function Dashboard({ user }) {
  const navigate = useNavigate();
  const name = user?.full_name?.trim() || "there";
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
    <main className="ish-user-dashboard">
      <div className="ish-user-dashboard-shell">
        <header className="ish-user-header">
          <Link className="ish-user-brand" to="/dashboard" aria-label="Ishara.ai dashboard">
            ishara.ai
          </Link>

          <nav className="ish-user-nav" aria-label="User dashboard navigation">
            <span className="ish-user-nav-item is-active" aria-current="page">Dashboard</span>
            <Link className="ish-user-nav-item" to="/dashboard/translation-history">Translation History</Link>
            <Link className="ish-user-nav-item" to="/dashboard/profile-settings">Profile / Settings</Link>
          </nav>

          <div className="ish-user-account">
            <span className="ish-user-avatar" aria-hidden="true">{initials || "I"}</span>
            <span className="ish-user-account-name">{name}</span>
            <button className="ish-user-signout" type="button" onClick={handleLogout}>Sign out</button>
          </div>
        </header>

        <section className="ish-user-welcome" aria-labelledby="ish-user-welcome-title">
          <div className="ish-user-welcome-copy">
            <span className="ish-user-workspace-badge"><span aria-hidden="true">✦</span> Premium workspace</span>
            <h1 id="ish-user-welcome-title">Hello, {name}! <span aria-hidden="true">👋</span></h1>
            <p>Welcome back to Ishara AI. Ready to communicate?</p>
          </div>
          <div className="ish-user-illustration" aria-label="Character illustration coming in a future update">
            <span className="ish-user-illustration-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="7" r="3.5" /><path d="M5.5 21v-2.2a6.5 6.5 0 0 1 13 0V21" /></svg>
            </span>
            <strong>Future character illustration</strong>
            <span>Reserved for culturally appropriate Pakistani character art</span>
          </div>
        </section>

        <section className="ish-user-actions" aria-label="Translation options">
          <article className="ish-user-action-card ish-user-camera-card">
            <div className="ish-user-card-topline">
              <span className="ish-user-action-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false"><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></svg>
              </span>
              <span className="ish-user-card-tag">Live</span>
            </div>
            <h2>Use Live Camera</h2>
            <p>Record your PSL signing using your camera.</p>
            <button className="ish-user-action-button ish-user-action-button-primary" type="button" onClick={() => navigate("/dashboard/live-camera")}>Open Camera</button>
          </article>

          <article className="ish-user-action-card ish-user-upload-card">
            <div className="ish-user-card-topline">
              <span className="ish-user-action-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false"><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>
              </span>
              <span className="ish-user-card-tag">Recorded</span>
            </div>
            <h2>Upload a Video</h2>
            <p>Choose a previously recorded PSL video.</p>
            <button className="ish-user-action-button ish-user-action-button-secondary" type="button" onClick={() => navigate("/dashboard/upload-video")}>Choose Video</button>
          </article>
        </section>

        <section className="ish-user-history" aria-labelledby="ish-user-history-title">
          <div className="ish-user-section-heading">
            <div>
              <h2 id="ish-user-history-title">Recent Translations</h2>
              <p>Your completed and in-progress translations will appear here.</p>
            </div>
            <Link className="ish-user-view-all" to="/dashboard/translation-history">View All</Link>
          </div>
          <div className="ish-user-empty-state">
            <span className="ish-user-empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false"><path d="M7 3.75h7l4 4V20a1.25 1.25 0 0 1-1.25 1.25h-9.5A1.25 1.25 0 0 1 6 20V5a1.25 1.25 0 0 1 1-1.25Z" /><path d="M14 4v4h4M9 13h6M9 16.5h6" /></svg>
            </span>
            <strong>No translations yet</strong>
            <span>Your recent translations will show up here once you get started.</span>
          </div>
        </section>

        <footer className="ish-user-footer">Communication without barriers.</footer>
      </div>
    </main>
  );
}

export default Dashboard;
