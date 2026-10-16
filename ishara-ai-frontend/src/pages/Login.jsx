
import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    setMessage(
      "Login form validated. Backend authentication will be connected later."
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="ISHARA AI home">
          <span className="brand-mark">I</span>
          <span>
            ISHARA <span className="brand-accent">AI</span>
          </span>
        </a>
        <span className="topbar-note">
          Communication without barriers
        </span>
      </header>

      <section className="signup-layout">
        <div className="intro">
          <span className="eyebrow">WELCOME BACK</span>
          <h1>Your journey toward accessible communication continues.</h1>
          <p>
            Sign in to access your ISHARA AI workspace and
            communicate through Pakistani Sign Language.
          </p>
        </div>

        <section className="signup-card" aria-labelledby="login-title">
          <div className="card-heading">
            <span className="card-label">YOUR ACCOUNT</span>
            <h2 id="login-title">Sign in</h2>
            <p>Enter your account details to continue.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setMessage("");
              }}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setMessage("");
              }}
              required
            />

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}

            <button className="submit-button" type="submit">
              Sign in <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="login-prompt">
            Don't have an account?{" "}
            <a className="text-button" href="/signup">
              Create an account
            </a>
          </p>

          <p className="privacy-note">
            Secure authentication will be enabled when the
            backend is connected.
          </p>
        </section>
      </section>

      <footer className="footer">
        ISHARA AI <span>·</span> Built for accessible communication
      </footer>
    </main>
  );
}

export default Login;
