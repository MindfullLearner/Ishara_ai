import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import AuthFeedback from "../components/AuthFeedback";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import PasswordField from "../components/PasswordField";
import PrimaryButton from "../components/PrimaryButton";
import { signupUser } from "../api/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_REQUIREMENTS = ["8+ characters", "1 uppercase letter", "1 number"];

function validateSignup({ fullName, email, password, confirmPassword }) {
  const errors = {};
  const cleanName = fullName.trim();
  const cleanEmail = email.trim();
  if (cleanName.length < 2 || cleanName.length > 100) errors.fullName = "Enter your full name (2–100 characters).";
  if (cleanEmail.length > 254 || !EMAIL_PATTERN.test(cleanEmail)) errors.email = "Enter a valid email address.";
  if (password.length < 8 || password.length > 128) errors.password = "Use between 8 and 128 characters.";
  else if (!/[A-Z]/.test(password) || !/\d/.test(password)) errors.password = "Include at least one uppercase letter and one number.";
  if (!confirmPassword) errors.confirmPassword = "Please confirm your password.";
  else if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";
  return errors;
}

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  async function handleSignup(event) {
    event.preventDefault();
    if (submitting.current) return;
    setSubmitError("");
    setSuccessMessage("");
    const nextErrors = validateSignup({ fullName, email, password, confirmPassword });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    submitting.current = true;
    setLoading(true);
    try {
      const destination = email.trim();
      const response = await signupUser({ full_name: fullName.trim(), email: destination, password });
      setRegisteredEmail(destination);
      setSuccessMessage(response.message || "Your account was created. A verification email was sent.");
    } catch (error) {
      setSubmitError(error.status === 409
        ? "This email is already registered. If the account is verified, sign in; otherwise, verification resend and email correction are not currently available."
        : error.message || "Unable to create your account. Please try again.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  function updateField(field, setter) {
    return (event) => {
      setter(event.target.value);
      setErrors((current) => ({ ...current, [field]: "" }));
      setSubmitError("");
    };
  }

  return (
    <AuthLayout pageClassName="ish-signup-page" layoutClassName="ish-signup-layout" mainClassName="ish-signup-main">
      <div className="ish-auth-card ish-signup-card">
        <header className="ish-card-heading">
          <h2>Create your account</h2>
          <p>Join Ishara AI and make communication more accessible</p>
        </header>
        {successMessage ? (
          <div className="ish-signup-success">
            <AuthFeedback variant="success">
              <p>{successMessage}</p>
              <p>Destination: <strong>{registeredEmail}</strong></p>
              <p>Check your Inbox and Spam/Junk folder for the verification link. Your email address is not verified until you open that link.</p>
              <p>If this address is incorrect or inaccessible, email correction and verification resend are not currently available.</p>
            </AuthFeedback>
            <PrimaryButton to="/login" className="ish-signup-return">Return to sign in</PrimaryButton>
          </div>
        ) : <>
          <p className="ish-signup-existing">Already have an account? <Link to="/login">Sign in</Link></p>
          <form className="ish-auth-form ish-signup-form" onSubmit={handleSignup} noValidate aria-busy={loading}>
            {submitError && <AuthFeedback variant="error"><p>{submitError}</p></AuthFeedback>}
            <FormField id="signup-full-name" label="Full name" error={errors.fullName} errorId="signup-name-error">
              <input id="signup-full-name" name="full_name" type="text" autoComplete="name" required maxLength={100} placeholder="Your full name" value={fullName} onChange={updateField("fullName", setFullName)} disabled={loading} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? "signup-name-error" : undefined} />
            </FormField>
            <FormField id="signup-email" label="Email address" error={errors.email} errorId="signup-email-error">
              <input id="signup-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" value={email} onChange={updateField("email", setEmail)} disabled={loading} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "signup-email-error" : undefined} />
            </FormField>
            <PasswordField id="signup-password" name="password" label="Password" placeholder="Create a password" value={password} onChange={updateField("password", setPassword)} showPassword={showPassword} onToggleVisibility={() => setShowPassword((visible) => !visible)} disabled={loading} error={errors.password} errorId="signup-password-error" requirements={PASSWORD_REQUIREMENTS} />
            <PasswordField id="signup-confirm-password" name="confirm_password" label="Confirm password" placeholder="Re-enter your password" value={confirmPassword} onChange={updateField("confirmPassword", setConfirmPassword)} showPassword={showConfirmPassword} onToggleVisibility={() => setShowConfirmPassword((visible) => !visible)} disabled={loading} error={errors.confirmPassword} errorId="signup-confirm-error" />
            <PrimaryButton type="submit" loading={loading} loadingLabel="Creating account…">Create account</PrimaryButton>
            <p className="ish-signup-terms">By creating an account, you agree to our Terms and Privacy Policy.</p>
          </form>
        </>}
      </div>
    </AuthLayout>
  );
}
