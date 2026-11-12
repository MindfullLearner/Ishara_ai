import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { verifyEmail } from "../api/auth";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  return <VerifyEmailStatus key={token} token={token} />;
}

function VerifyEmailStatus({ token }) {
  const handledToken = useRef("");
  const mounted = useRef(false);
  const [result, setResult] = useState(() => token
    ? { status: "loading", message: "" }
    : {
        status: "error",
        message: "This verification link is missing its token or has expired.",
      });

  useEffect(() => {
    mounted.current = true;

    if (!token) {
      return () => {
        mounted.current = false;
      };
    }

    if (handledToken.current !== token) {
      handledToken.current = token;
      const requestedToken = token;
      verifyEmail(token)
        .then((response) => {
          if (mounted.current && handledToken.current === requestedToken) {
            setResult({
              status: "success",
              message: response.message || "Your email has been verified successfully.",
            });
          }
        })
        .catch((error) => {
          if (mounted.current && handledToken.current === requestedToken) {
            setResult({
              status: "error",
              message: error.message || "This verification link is invalid or expired.",
            });
          }
        });
    }

    return () => {
      mounted.current = false;
    };
  }, [token]);

  const isLoading = result.status === "loading";
  const isSuccess = result.status === "success";

  return (
    <AuthLayout>
      <div className="ish-auth-card ish-simple-auth-card" aria-live="polite">
        <header className="ish-card-heading">
          <h2>{isLoading ? "Verify your email" : isSuccess ? "Email verified" : "Verification unsuccessful"}</h2>
          <p>
            {isLoading
              ? "We’re confirming your email address."
              : isSuccess
                ? result.message
                : result.message}
          </p>
        </header>
        {isLoading ? (
          <p className="ish-auth-progress" role="status">Verifying your email…</p>
        ) : (
          <Link className="ish-primary-button ish-auth-return" to="/login">
            Return to sign in
          </Link>
        )}
      </div>
    </AuthLayout>
  );
}
