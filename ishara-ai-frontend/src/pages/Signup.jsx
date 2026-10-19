
import { useState } from "react";
import { Link } from "react-router-dom";
import { signupUser } from "../api/auth";
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

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [symbolStage, setSymbolStage] = useState("create");
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const [confirmedSymbols, setConfirmedSymbols] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentSequence =
    symbolStage === "create" ? selectedSymbols : confirmedSymbols;

  function selectSymbol(symbol) {
    setError("");
    setSuccess(false);

    if (currentSequence.length >= SEQUENCE_LENGTH) return;

    if (symbolStage === "create") {
      setSelectedSymbols((previous) => [...previous, symbol.id]);
    } else {
      setConfirmedSymbols((previous) => [...previous, symbol.id]);
    }
  }

  function undoLastSymbol() {
    if (symbolStage === "create") {
      setSelectedSymbols((previous) => previous.slice(0, -1));
    } else {
      setConfirmedSymbols((previous) => previous.slice(0, -1));
    }

    setError("");
  }

  function clearSequence() {
    if (symbolStage === "create") {
      setSelectedSymbols([]);
    } else {
      setConfirmedSymbols([]);
    }

    setError("");
  }

  function beginConfirmation() {
    if (selectedSymbols.length !== SEQUENCE_LENGTH) {
      setError("Please select exactly five symbols first.");
      return;
    }

    setConfirmedSymbols([]);
    setSymbolStage("confirm");
    setError("");
  }

  function goBackToCreate() {
    setSymbolStage("create");
    setConfirmedSymbols([]);
    setError("");
  }

  function resetForm() {
    setUsername("");
    setEmail("");
    setSelectedSymbols([]);
    setConfirmedSymbols([]);
    setSymbolStage("create");
    setError("");
    setSuccess(false);
  }

  
async function handleSignup(event) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      setError(
        "Username must be 3–30 characters and use only letters, numbers, or underscores."
      );
      return;
    }

    if (
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    if (selectedSymbols.length !== SEQUENCE_LENGTH) {
      setError("Please create your five-symbol sequence.");
      setSymbolStage("create");
      return;
    }

    if (confirmedSymbols.length !== SEQUENCE_LENGTH) {
      setError("Please confirm your five-symbol sequence.");
      setSymbolStage("confirm");
      return;
    }

    const sequencesMatch = selectedSymbols.every(
      (symbol, index) => symbol === confirmedSymbols[index]
    );

    if (!sequencesMatch) {
      setError(
        "Your symbol sequences do not match. Please try confirming again."
      );
      setConfirmedSymbols([]);
      setSymbolStage("confirm");
      return;
    }

    setLoading(true);

    try {
      await signupUser({
        username: cleanUsername,
        email: cleanEmail,
        sequence: selectedSymbols,
      });

      setSuccess(true);
    } catch (requestError) {
      setError(
        requestError.message || "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function renderSequence(sequence) {
    return Array.from({ length: SEQUENCE_LENGTH }, (_, index) => {
      const symbol = SYMBOLS.find(
        (item) => item.id === sequence[index]
      );

      return (
        <div
          className={`ishara-sequence-slot ${symbol ? "is-filled" : ""}`}
          key={index}
        >
          {symbol ? (
            symbol.icon
          ) : (
            <span>{index + 1}</span>
          )}
        </div>
      );
    });
  }

  return (
    <main className="ishara-signup-page">
      <section className="ishara-signup-brand">
        <Link to="/login" className="ishara-signup-back">
          ← Back to login
        </Link>

        <div className="ishara-signup-brand-content">
          <img
            src="/ishara_logo.png"
            alt="ISHARA AI logo"
            className="ishara-signup-logo"
          />


          <h1>Welcome to ISHARA AI</h1>

          <p>
            A more accessible world starts with understanding each other.
            Create your account and begin your journey.
          </p>

          <div className="ishara-signup-feature">
            <span>💬</span>
            <div>
              <strong>Communicate</strong>
              <small>Make communication easier</small>
            </div>
          </div>

          <div className="ishara-signup-feature">
            <span>🤟</span>
            <div>
              <strong>Connect</strong>
              <small>Bring people closer together</small>
            </div>
          </div>
        </div>
      </section>

      <section className="ishara-signup-form-section">
        <div className="ishara-signup-card">
          <div className="ishara-signup-heading">
            <span className="ishara-signup-eyebrow">
              CREATE YOUR ACCOUNT
            </span>
            <h2>Join ISHARA AI</h2>
            <p>
              Create your username and use a personal symbol sequence
              instead of a traditional password.
            </p>
          </div>

          {success ? (
            <div className="ishara-signup-success" role="status">
              <div className="ishara-success-icon">✓</div>
              <h3>Account created successfully!</h3>
              <p>
                Your account has been saved to the ISHARA AI database.
              </p>

              <p className="ishara-demo-note">
                Email verification is not implemented yet. Your account has been
                created, but email ownership has not been verified.
              </p>

              <Link to="/login" className="ishara-signup-submit">
                Go to login
              </Link>

              <button
                type="button"
                className="ishara-signup-reset"
                onClick={resetForm}
              >
                Test signup again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignup} noValidate>
              <div className="ishara-signup-field">
                <label htmlFor="ishara-username">Username</label>
                <input
                  id="ishara-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="e.g. ishara_user"
                  value={username}
                  maxLength={30}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setError("");
                  }}
                  required
                />
                <small>
                  Use 3–30 letters, numbers, or underscores.
                </small>
              </div>

              <div className="ishara-signup-field ishara-email-field">
                <label htmlFor="ishara-email">Email address</label>
                <input
                  id="ishara-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  maxLength={254}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  required
                />
                <small>
                  Your email will be used for account verification and recovery.
                </small>
              </div>

              <div className="ishara-signup-divider" />

              <div className="ishara-signup-step-heading">
                <span className="ishara-step-number">1</span>
                <div>
                  <h3>
                    {symbolStage === "create"
                      ? "Create your symbol sequence"
                      : "Confirm your symbol sequence"}
                  </h3>
                  <p>
                    {symbolStage === "create"
                      ? "Choose five symbols in the order you want to remember."
                      : "Select the same five symbols in exactly the same order."}
                  </p>
                </div>
              </div>

              <div className="ishara-symbol-options">
                {SYMBOLS.map((symbol) => (
                  <button
                    key={symbol.id}
                    type="button"
                    className="ishara-symbol-option"
                    onClick={() => selectSymbol(symbol)}
                    disabled={currentSequence.length >= SEQUENCE_LENGTH}
                    aria-label={`Select ${symbol.label}`}
                    title={symbol.label}
                  >
                    {symbol.icon}
                  </button>
                ))}
              </div>

              <div className="ishara-sequence-label">
                <span>
                  {symbolStage === "create"
                    ? "Your new sequence"
                    : "Confirm your sequence"}
                </span>
                <span>
                  {currentSequence.length}/{SEQUENCE_LENGTH}
                </span>
              </div>

              <div
                className="ishara-selected-sequence"
                aria-label="Selected symbol sequence"
              >
                {renderSequence(currentSequence)}
              </div>

              <div className="ishara-pattern-actions">
                <button
                  type="button"
                  className="ishara-signup-reset"
                  onClick={undoLastSymbol}
                  disabled={currentSequence.length === 0}
                >
                  Undo last
                </button>

                <button
                  type="button"
                  className="ishara-signup-reset"
                  onClick={clearSequence}
                  disabled={currentSequence.length === 0}
                >
                  Clear
                </button>

                {symbolStage === "create" ? (
                  <button
                    type="button"
                    className="ishara-small-primary"
                    onClick={beginConfirmation}
                    disabled={selectedSymbols.length !== SEQUENCE_LENGTH}
                  >
                    Confirm sequence →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ishara-signup-reset"
                    onClick={goBackToCreate}
                  >
                    ← Change sequence
                  </button>
                )}
              </div>

              <p className="ishara-signup-security-note">
                Keep your sequence private. After three failed login
                attempts, the backend will temporarily block further
                attempts and require a secure recovery process.
              </p>

              {error && (
                <p className="ishara-signup-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="ishara-signup-submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>

              <p className="ishara-signup-login-link">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

export default Signup;
