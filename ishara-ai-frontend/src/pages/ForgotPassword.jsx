import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import AuthFeedback from "../components/AuthFeedback";
import PrimaryButton from "../components/PrimaryButton";
import { forgotPassword } from "../api/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const submitting = useRef(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current) return;

    const normalizedEmail = email.trim();
    if (normalizedEmail.length > 254 || !EMAIL_PATTERN.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      setSent(false);
      return;
    }

    setError("");
    submitting.current = true;
    setLoading(true);
    try {
      await forgotPassword(normalizedEmail);
      setSent(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to send the reset link. Please try again.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="ish-auth-card ish-simple-auth-card">
        <header className="ish-card-heading">
          <h2>Forgot your password?</h2>
          <p>Enter your email address and we’ll send password reset instructions.</p>
        </header>

        {sent ? (
          <AuthFeedback variant="success"><p>If an account exists with this email, a password reset link will be sent.</p></AuthFeedback>
        ) : (
          <form className="ish-simple-auth-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
            {error && <AuthFeedback variant="error"><p>{error}</p></AuthFeedback>}
            <FormField id="forgot-email" label="Email address">
              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                disabled={loading}
                required
              />
            </FormField>
            <PrimaryButton type="submit" loading={loading} loadingLabel="Sending…">Send reset link</PrimaryButton>
          </form>
        )}

        <p className="ish-auth-bottom-link"><Link to="/login">Return to sign in</Link></p>
      </div>
    </AuthLayout>
  );
}
