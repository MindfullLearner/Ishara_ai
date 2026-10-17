
import { useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Your password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    // Frontend demonstration only.
    // Connect your backend registration API here later.
    setMessage("Your form is ready. Account creation is not connected to a backend yet.");
  }

  return (
    <main className="auth-page">
      <section className="auth-card signup-card">
        <section className="form-panel signup-form-panel">
          <div className="auth-form-wrap signup-form-wrap">
            <h2>Create Your Account</h2>
            <p className="form-subtitle">
              Join Ishara AI and be part of an inclusive community.
            </p>

            <form onSubmit={handleSubmit}>
              <label className="field-label" htmlFor="signup-name"><img src="/icons/user.png" alt="" />
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />

              <label className="field-label" htmlFor="signup-name"><img src="/icons/user.png" alt="" />
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <label className="field-label" htmlFor="login-password"><img src="/icons/padlock.png" alt="" />
                Password
              </label>
              <div className="password-wrap">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <label className="field-label" htmlFor="login-password"><img src="/icons/padlock.png" alt="" />
                Confirm Password
              </label>
              <div className="password-wrap">
                <input
                  id="signup-confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>

              {message && <p className="form-message">{message}</p>}

              <button className="primary-button" type="submit">
                Create Account <span>→</span>
              </button>
            </form>

            <p className="auth-switch signup-switch">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </section>

        <aside className="brand-panel signup-brand">
          <Link to="/login" className="brand-logo centered-logo">
            <img src="/ishara_logo.png" alt="ISHARA.AI logo" />
            <span>ISHARA.AI</span>
          </Link>

          <div className="signup-art" aria-hidden="true">
            <span className="art-orb orb-four" />
            <span className="art-orb orb-five" />
            <span className="hands-symbol signup-hands">🤟</span>
          </div>

          <div className="signup-brand-copy">
            <h2>Together for a<br />more inclusive world</h2>
            <p>Technology that understands everyone.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
