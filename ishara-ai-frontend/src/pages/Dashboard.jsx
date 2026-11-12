import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../api/auth";

function Dashboard({ user }) {
  const navigate = useNavigate();
  function handleLogout() {
    logoutUser();
    navigate("/login", { replace: true });
  }

  const name = user?.full_name?.trim() || "there";
  const initials = user?.full_name?.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "I";

  return (
    <main className="ish-dashboard">
      <header className="ish-dashboard-header">
        <Link className="ish-dashboard-brand" to="/dashboard" aria-label="Ishara AI home"><span className="ish-dashboard-brand-mark">i</span><span>ishara<span>.ai</span></span></Link>
        <nav className="ish-dashboard-nav" aria-label="Main navigation"><Link to="/dashboard" aria-current="page">Overview</Link></nav>
        <div className="ish-dashboard-account">
          <span className="ish-dashboard-avatar" aria-hidden="true">{initials}</span>
          <span className="ish-dashboard-account-name">{name}</span>
          <button className="ish-button ish-button--quiet" type="button" onClick={handleLogout}>Sign out</button>
        </div>
      </header>
      <div className="ish-dashboard-content">
        <section className="ish-dashboard-welcome">
          <div><span className="ish-eyebrow">YOUR ISHARA AI SPACE</span><h1>Welcome, {name}</h1><p>Your account is ready. We’re building more ways to make communication accessible.</p></div>
          <span className="ish-dashboard-welcome-art" aria-hidden="true"><i /><b /></span>
        </section>
        <section className="ish-dashboard-grid" aria-label="Account overview">
          <article className="ish-dashboard-card ish-dashboard-next">
            <span className="ish-dashboard-icon" aria-hidden="true">✦</span><span className="ish-eyebrow">NEXT STEPS</span><h2>Your communication space</h2><p>New Ishara AI tools and experiences will appear here as they become available.</p><span className="ish-coming-soon">More coming soon</span>
          </article>
          <article className="ish-dashboard-card ish-dashboard-profile">
            <div className="ish-dashboard-card-heading"><div><span className="ish-eyebrow">ACCOUNT</span><h2>Your profile</h2></div><span className="ish-dashboard-profile-avatar" aria-hidden="true">{initials}</span></div>
            <dl><div><dt>Full name</dt><dd>{user?.full_name || "—"}</dd></div><div><dt>Email address</dt><dd>{user?.email || "—"}</dd></div><div><dt>Account status</dt><dd><span className={`ish-status-badge ${user?.is_verified ? "is-verified" : ""}`}>{user?.is_verified ? "Verified" : "Verification pending"}</span></dd></div></dl>
          </article>
        </section>
        <footer className="ish-dashboard-footer">Communication without barriers.</footer>
      </div>
    </main>
  );
}

export default Dashboard;
