
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthFeedback from "../components/AuthFeedback";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import PasswordField from "../components/PasswordField";
import PrimaryButton from "../components/PrimaryButton";
import { loginUser } from "../api/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [accountSuspended, setAccountSuspended] = useState(false);
  const submitting = useRef(false);

  async function handleLogin(event) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    setNeedsVerification(false);
    setAccountSuspended(false);

    try {
      submitting.current = true;
      setLoading(true);
      const result = await loginUser({ email: email.trim(), password });
      navigate(result.user?.role === "admin" ? "/admin" : "/dashboard", {
        replace: true,
      });
    } catch (requestError) {
      const detail = requestError.message ||
        "The email or password is incorrect. Check your details and try again.";
      const isForbidden = requestError.status === 403;
      const isUnverified = isForbidden && /verif/i.test(detail);
      const isSuspended = isForbidden && /suspend/i.test(detail);

      setNeedsVerification(isUnverified);
      setAccountSuspended(isSuspended);
      setError(isSuspended
        ? "This account is suspended. Please contact an administrator."
        : detail);
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="ish-auth-card ish-login-card">
        <header className="ish-card-heading">
          <h2>Welcome back</h2>
          <p>Sign in to continue your Ishara AI journey</p>
        </header>

        <form className="ish-auth-form" onSubmit={handleLogin} aria-busy={loading}>
          {error && (
            <AuthFeedback variant="error" title="We couldn’t sign you in.">
              <p>{error}</p>
              {needsVerification && (
                <p className="ish-login-verification-help">
                  Check your inbox for the verification email and open its link before signing in.
                </p>
              )}
              {accountSuspended && (
                <p className="ish-login-verification-help">
                  Sign-in is disabled for this account. Contact an administrator for help.
                </p>
              )}
            </AuthFeedback>
          )}

          <FormField id="login-email" label="Email address">
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              required
            />
          </FormField>

          <PasswordField
            id="login-password"
            name="password"
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            showPassword={showPassword}
            onToggleVisibility={() => setShowPassword((visible) => !visible)}
            disabled={loading}
          />

          <div className="ish-auth-form-options">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <PrimaryButton type="submit" loading={loading} loadingLabel="Signing in…">
            Sign in
          </PrimaryButton>
        </form>

        <div className="ish-or-divider">OR CONTINUE WITH</div>

        <button
          type="button"
          className="ish-google-button"
          disabled
          title="Google sign-in is coming soon."
          aria-label="Google sign-in coming soon"
        >
          Continue with Google <span>Coming soon</span>
        </button>

        <p className="ish-create-link">
          Don’t have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
