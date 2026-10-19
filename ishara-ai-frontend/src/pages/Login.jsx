
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import "../App.css";

const SYMBOLS = [
  { id: "heart", icon: "❤️", label: "Heart" },
  { id: "star", icon: "⭐", label: "Star" },
  { id: "moon", icon: "🌙", label: "Moon" },
  { id: "sun", icon: "☀️", label: "Sun" },
  { id: "flower", icon: "🌸", label: "Flower" },
  { id: "lightning", icon: "⚡", label: "Lightning" },
  { id: "leaf", icon: "🍃", label: "Leaf" },
  { id: "rainbow", icon: "🌈", label: "Rainbow" },
];

const SEQUENCE_LENGTH = 5;

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTutorialInfo, setShowTutorialInfo] = useState(false);

  function selectSymbol(symbol) {
    setError("");
    setNotice("");

    setSelectedSymbols((previous) => {
      if (previous.length >= SEQUENCE_LENGTH) return previous;
      return [...previous, symbol.id];
    });
  }

  function undoLastSymbol() {
    setSelectedSymbols((previous) => previous.slice(0, -1));
    setError("");
    setNotice("");
  }

  function clearSequence() {
    setSelectedSymbols([]);
    setError("");
    setNotice("");
  }

  
async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const cleanUsername = username.trim();

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      setError(
        "Enter a valid username using 3–30 letters, numbers, or underscores."
      );
      return;
    }

    if (selectedSymbols.length !== SEQUENCE_LENGTH) {
      setError("Please select all five symbols in your sequence.");
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser({
        username: cleanUsername,
        sequence: selectedSymbols,
      });

      // Successful login: the API helper has saved the token.
      setAttemptsRemaining(3);
      setIsLocked(false);

      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      const message =
        requestError.message || "Unable to sign in. Please try again.";

      if (requestError.status === 423) {
        setAttemptsRemaining(0);
        setIsLocked(true);
        setError(
          "Your account is temporarily locked. Please try again in 15 minutes."
        );
      } else if (requestError.status === 401) {
        setIsLocked(false);

        setAttemptsRemaining((previous) => {
          const remaining = Math.max(previous - 1, 0);

          setError(
            remaining > 0
              ? `Invalid username or symbol sequence. ${remaining} ${
                  remaining === 1 ? "attempt" : "attempts"
                } remaining.`
              : "Invalid username or symbol sequence. Your account may now be locked."
          );

          return remaining;
        });
      } else {
        setError(message);
      }

    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="ishara-login-page">
      <section className="ishara-login-brand">
        <div className="ishara-login-brand-content">
          <img
            src="/ishara_logo.png"
            alt="ISHARA AI logo"
            className="ishara-login-logo"
          />

          <h1>Communication without barriers.</h1>

          <p>
            Welcome back to ISHARA AI, where technology helps people
            understand one another.
          </p>

          <div className="ishara-login-features">
            <div>
              <span>💬</span>
              <small>Type</small>
            </div>
            <div>
              <span>📷</span>
              <small>Record</small>
            </div>
            <div>
              <span>🤟</span>
              <small>Get response</small>
            </div>
          </div>
        </div>
      </section>

      <section className="ishara-login-form-section">
        <div className="ishara-login-card">
          <div className="ishara-login-heading">
            <span className="ishara-login-eyebrow">WELCOME BACK</span>
            <h2>Sign in to ISHARA AI</h2>
            <p>Use your username and personal symbol sequence.</p>
          </div>

          <form onSubmit={handleLogin} noValidate>
            <div className="ishara-login-field">
              <label htmlFor="ishara-login-username">Username</label>
              <input
                id="ishara-login-username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                maxLength={30}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError("");
                  setNotice("");
                }}
                required
              />
            </div>

            <div className="ishara-login-divider" />

            <div className="ishara-login-step-heading">
              <span className="ishara-login-step-number">1</span>
              <div>
                <h3>Your symbol sequence</h3>
                <p>Select your five symbols in the order you created them.</p>
              </div>
            </div>

            <div className="ishara-login-symbol-options">
              {SYMBOLS.map((symbol) => (
                <button
                  key={symbol.id}
                  type="button"
                  className="ishara-login-symbol-option"
                  onClick={() => selectSymbol(symbol)}
                  disabled={
                    loading || selectedSymbols.length >= SEQUENCE_LENGTH
                  }
                  aria-label={`Select ${symbol.label}`}
                  title={symbol.label}
                >
                  {symbol.icon}
                </button>
              ))}
            </div>

            <div className="ishara-login-sequence-label">
              <span>Selected sequence</span>
              <span>
                {selectedSymbols.length}/{SEQUENCE_LENGTH}
              </span>
            </div>

            <div
              className="ishara-login-selected-sequence"
              aria-label="Your selected symbol sequence"
            >
              {Array.from({ length: SEQUENCE_LENGTH }, (_, index) => {
                const selected = SYMBOLS.find(
                  (symbol) => symbol.id === selectedSymbols[index]
                );

                return (
                  <div
                    key={index}
                    className={`ishara-login-sequence-slot ${
                      selected ? "is-filled" : ""
                    }`}
                  >
                    {selected ? selected.icon : <span>{index + 1}</span>}
                  </div>
                );
              })}
            </div>

            <div className="ishara-login-actions">
              <button
                type="button"
                className="ishara-login-secondary"
                onClick={undoLastSymbol}
                disabled={loading || selectedSymbols.length === 0}
              >
                Undo last
              </button>

              <button
                type="button"
                className="ishara-login-secondary"
                onClick={clearSequence}
                disabled={loading || selectedSymbols.length === 0}
              >
                Clear
              </button>
            </div>

            {error && (
              <p className="ishara-login-error" role="alert">
                {error}
              </p>
            )}

            {notice && (
              <p className="ishara-login-notice" role="status">
                {notice}
              </p>
            )}

            <button
              type="submit"
              className="ishara-login-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="ishara-login-help">
            <button
              type="button"
              className="ishara-login-text-button"
              onClick={() => {
                setError("");
                setNotice(
                  "Account recovery is not implemented yet. Email verification and a secure recovery process are still needed."
                );
              }}
            >
              Forgot your symbol sequence?
            </button>

            <p>
              New to ISHARA AI? <Link to="/signup">Create an account</Link>
            </p>
          </div>

          <button
            type="button"
            className="ishara-tutorial-button"
            onClick={() => setShowTutorialInfo((previous) => !previous)}
            aria-expanded={showTutorialInfo}
          >
            <span aria-hidden="true">▶</span>
            Sign-language tutorial
          </button>

          {showTutorialInfo && (
            <div className="ishara-tutorial-info" role="status">
              <strong>Tutorial video</strong>
              <p>
                Add your video file to
                <code> public/videos/login-tutorial.mp4 </code>
                when it is ready. We can then connect it to this button.
              </p>
            </div>
          )}

          <p className="ishara-login-security-note">
            Keep your symbol sequence private. Repeated failed attempts are
            temporarily blocked by the backend.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
