
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { getCurrentUser } from "./api/auth";
import "./App.css";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    let active = true;

    async function verifySession() {
      try {
        const currentUser = await getCurrentUser();

        if (active) {
          setUser(currentUser);
        }
      } catch {
        if (active) {
          setSessionError(
            "Unable to verify your session. Check that the backend is running and try again."
          );
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    verifySession();

    return () => {
      active = false;
    };
  }, []);

  if (checkingSession) {
    return <p>Verifying your session...</p>;
  }

  if (sessionError) {
    return (
      <main className="ishara-login-page">
        <section className="ishara-login-form-section">
          <div className="ishara-login-card">
            <p role="alert">{sessionError}</p>
            <button
              className="ishara-login-submit"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
