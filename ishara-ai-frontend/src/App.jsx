
import { cloneElement, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import AddUser from "./pages/admin/AddUser";
import EditUser from "./pages/admin/EditUser";
import PSLDictionary from "./pages/admin/PSLDictionary";
import AddPSLSign from "./pages/admin/AddPSLSign";
import EditPSLSign from "./pages/admin/EditPSLSign";
import KnowledgeBase from "./pages/admin/KnowledgeBase";
import AddArticle from "./pages/admin/AddArticle";
import EditArticle from "./pages/admin/EditArticle";
import SystemLogs from "./pages/admin/SystemLogs";
import ProcessingActivity from "./pages/admin/ProcessingActivity";
import ProfileSettings from "./pages/admin/ProfileSettings";
import { getCurrentUser } from "./api/auth";
import AuthFeedback from "./components/AuthFeedback";
import AuthLayout from "./components/AuthLayout";
import PrimaryButton from "./components/PrimaryButton";
import "./App.css";

function ProtectedRoute({ children, requiredRole }) {
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

  useEffect(() => {
    function handleSessionExpired() {
      setSessionError("");
      setUser(null);
      setCheckingSession(false);
    }

    window.addEventListener("ishara:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("ishara:session-expired", handleSessionExpired);
    };
  }, []);

  if (checkingSession) {
    return (
      <AuthLayout>
        <div className="ish-auth-card ish-state-card" aria-live="polite">
          <span className="ish-loading-indicator" aria-hidden="true" />
          <h2>Checking your session</h2>
          <p>Please wait while we securely load your account.</p>
        </div>
      </AuthLayout>
    );
  }

  if (sessionError) {
    return (
      <AuthLayout>
        <div className="ish-auth-card ish-state-card">
          <h2>We couldn’t verify your session</h2>
          <AuthFeedback variant="error"><p>{sessionError}</p></AuthFeedback>
          <PrimaryButton onClick={() => window.location.reload()}>Try again</PrimaryButton>
          </div>
      </AuthLayout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return cloneElement(children, { user });
}

function AdminRoute({ children }) {
  return <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>;
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
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="users/add" element={<AddUser />} />
          <Route path="users/edit/:userId" element={<EditUser />} />
          <Route path="psl-dictionary" element={<PSLDictionary />} />
          <Route path="psl-dictionary/add" element={<AddPSLSign />} />
          <Route path="psl-dictionary/edit/:signId" element={<EditPSLSign />} />
          <Route path="knowledge-base" element={<KnowledgeBase />} />
          <Route path="knowledge-base/add" element={<AddArticle />} />
          <Route path="knowledge-base/edit/:articleId" element={<EditArticle />} />
          <Route path="system-logs" element={<SystemLogs />} />
          <Route path="processing-activity" element={<ProcessingActivity />} />
          <Route path="profile-settings" element={<ProfileSettings />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
