import { useState } from "react";
import "../App.css";
      

function App() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
    setMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setMessage("Your password must be at least 8 characters.");
      return;
    }

    setMessage(
      "Form validated! Account creation will be connected to the backend later."
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="ISHARA AI home">
          <span className="brand-mark" aria-hidden="true">I</span>
          <span>ISHARA <span className="brand-accent">AI</span></span>
        </a>
        <span className="topbar-note">Communication without barriers</span>
      </header>

      <section className="signup-layout">
        <div className="intro">
          <span className="eyebrow">WELCOME TO ISHARA AI</span>
          <h1>Every sign deserves to be understood.</h1>
          <p>
            A more accessible way to connect through Pakistani Sign Language.
            Create your account to get started.
          </p>

          <div className="feature">
            <span className="feature-icon" aria-hidden="true">◎</span>
            <div>
              <h3>Accessible communication</h3>
              <p>Designed with clarity and accessibility in mind.</p>
            </div>
          </div>

          <div className="feature">
            <span className="feature-icon" aria-hidden="true">↗</span>
            <div>
              <h3>One step at a time</h3>
              <p>Sign in, submit a sign-language query, and view a response.</p>
            </div>
          </div>
        </div>

        <section className="signup-card" aria-labelledby="signup-title">
          <div className="card-heading">
            <span className="card-label">GET STARTED</span>
            <h2 id="signup-title">Create your account</h2>
            <p>Enter your details below to register.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              minLength={2}
              maxLength={120}
              value={form.fullName}
              onChange={handleChange}
              required
            />

            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              maxLength={128}
              value={form.password}
              onChange={handleChange}
              required
            />

            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Enter your password again"
              minLength={8}
              maxLength={128}
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}

            <button className="submit-button" type="submit">
              Create account <span aria-hidden="true">→</span>
            </button>
          </form>

          
            <p className="login-prompt">
            Already have an account?{" "}
            <a className="text-button" href="/login">
                Sign in
            </a>
            </p>


          <p className="privacy-note">
            Your account details will be handled securely when backend
            integration is added.
          </p>
        </section>
      </section>

      <footer className="footer">
        ISHARA AI <span>·</span> Built for accessible communication
      </footer>
    </main>
  );
}

export default App;
