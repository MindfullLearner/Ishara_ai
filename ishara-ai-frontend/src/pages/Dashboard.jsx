
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../api/auth";

function Dashboard() {
  const navigate = useNavigate();

  function handleLogout() {
    logoutUser();
    navigate("/login", { replace: true });
  }

  return (
    <main className="ishara-login-page">
      <section className="ishara-login-form-section">
        <div className="ishara-login-card">
          <div className="ishara-login-heading">
            <span className="ishara-login-eyebrow">
              ISHARA AI
            </span>

            <h2>Welcome to your dashboard!</h2>

            <p>
              You have successfully signed in.
              Your next step toward communication without barriers
              starts here.
            </p>
          </div>

          <button
            type="button"
            className="ishara-login-submit"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
