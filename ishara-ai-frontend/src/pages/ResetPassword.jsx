import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { resetPassword } from "../api/auth";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  return <ResetPasswordForm key={token} token={token} />;
}

function ResetPasswordForm({ token }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const submitting = useRef(false);

  function validate() {
    const nextErrors = {};
    if (password.length < 8 || password.length > 128) {
      nextErrors.password = "Use between 8 and 128 characters.";
    } else if (!/[A-Z]/.test(password)) {
      nextErrors.password = "Include at least one uppercase letter.";
    } else if (!/\d/.test(password)) {
      nextErrors.password = "Include at least one number.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your new password.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    setRequestError("");
    if (Object.keys(nextErrors).length || !token) {
      if (!token) setRequestError("This password reset link is invalid or expired.");
      return;
    }

    submitting.current = true;
    setLoading(true);
    try {
      const response = await resetPassword({ token, new_password: password });
      setSuccessMessage(response.message || "Password reset successfully. You can now sign in.");
    } catch (error) {
      setRequestError(error.message || "This password reset link is invalid or expired.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  function updateField(field, setter) {
    return (event) => {
      setter(event.target.value);
      setErrors((current) => ({ ...current, [field]: "" }));
      setRequestError("");
    };
  }

  return (
    <AuthLayout>
      <div className="ish-auth-card ish-simple-auth-card">
        <header className="ish-card-heading">
          <h2>Reset your password</h2>
          <p>Choose a new password for your Ishara AI account.</p>
        </header>

        {successMessage ? (
          <div className="ish-auth-success" role="status">
            <p>{successMessage}</p>
            <Link className="ish-primary-button ish-auth-return" to="/login">Return to sign in</Link>
          </div>
        ) : !token ? (
          <div className="ish-error-message" role="alert">
            <p>This password reset link is invalid or expired.</p>
          </div>
        ) : (
          <form className="ish-simple-auth-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
            {requestError && <div className="ish-error-message" role="alert"><p>{requestError}</p></div>}
            <div className="ish-form-field">
              <label htmlFor="reset-password">New password</label>
              <div className="ish-password-field">
                <input
                  id="reset-password"
                  name="new_password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  maxLength={128}
                  placeholder="Create a new password"
                  value={password}
                  onChange={updateField("password", setPassword)}
                  disabled={loading}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "reset-password-requirements reset-password-error" : "reset-password-requirements"}
                  required
                />
                <button
                  type="button"
                  className="ish-eye-button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide new password" : "Show new password"}
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <ul className="ish-password-requirements" id="reset-password-requirements">
                <li>8+ characters</li>
                <li>1 uppercase letter</li>
                <li>1 number</li>
              </ul>
              {errors.password && <small className="ish-field-error" id="reset-password-error" role="alert">{errors.password}</small>}
            </div>

            <div className="ish-form-field">
              <label htmlFor="reset-confirm-password">Confirm new password</label>
              <div className="ish-password-field">
                <input
                  id="reset-confirm-password"
                  name="confirm_password"
                  type={showConfirmation ? "text" : "password"}
                  autoComplete="new-password"
                  maxLength={128}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={updateField("confirmPassword", setConfirmPassword)}
                  disabled={loading}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? "reset-confirm-error" : undefined}
                  required
                />
                <button
                  type="button"
                  className="ish-eye-button"
                  onClick={() => setShowConfirmation((visible) => !visible)}
                  aria-label={showConfirmation ? "Hide password confirmation" : "Show password confirmation"}
                  disabled={loading}
                >
                  {showConfirmation ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirmPassword && <small className="ish-field-error" id="reset-confirm-error" role="alert">{errors.confirmPassword}</small>}
            </div>

            <button className="ish-primary-button" type="submit" disabled={loading}>
              {loading ? "Resetting password…" : "Reset password"}
            </button>
          </form>
        )}

        {!successMessage && <p className="ish-auth-bottom-link"><Link to="/login">Return to sign in</Link></p>}
      </div>
    </AuthLayout>
  );
}
