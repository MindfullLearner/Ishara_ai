
import { useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    // Frontend demonstration only.
    // Connect your backend authentication API here later.
    setError("Login form is ready. Backend authentication is not connected yet.");
  }

  return (
    <main className="auth-page">
      <section className="auth-card login-card">
        <aside className="brand-panel login-brand">
          <Link to="/login" className="brand-logo">
            <img src="/ishara_logo.png" alt="ISHARA.AI logo" />
            <span>ISHARA.AI</span>
          </Link>

          <div className="brand-copy">
            <h1>Communication<br />without barriers</h1>
            <p>
              AI-powered sign language assistant for a more
              inclusive tomorrow.
            </p>
          </div>

          <div className="hands-art" aria-hidden="true">
            <span className="art-orb orb-one" />
            <span className="art-orb orb-two" />
            <span className="art-orb orb-three" />
            <span className="hands-symbol">🤟</span>
          </div>

          <div className="brand-features">
            <div><span><img src="/icons/message.png" alt="Message" /></span><small>Type</small></div>
            <div><span><img src="/icons/camera.png" alt="Camera" /></span><small>Record</small></div>
            <div><span><img src="/icons/handRaise.png" alt="Hand Raise" /></span><small>Get Response</small></div>
          </div>
        </aside>

        <section className="form-panel">
          <div className="auth-form-wrap">
            <h2>Welcome Back!</h2>
            <p className="form-subtitle">Sign in to continue to Ishara AI.</p>

            <form onSubmit={handleSubmit}>
              <label className="field-label" htmlFor="login-email"><img src="/icons/user.png" alt="User" />

                Email address
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="Enter your email"
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
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="form-options">
                <label className="remember-option">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="small-link">
                  Forgot password?
                </Link>
              </div>

              {error && <p className="form-message">{error}</p>}

              <button className="primary-button" type="submit">
                Login <span>→</span>
              </button>
            </form>

            <div className="or-divider"><span>or</span></div>

            <p className="auth-switch">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
