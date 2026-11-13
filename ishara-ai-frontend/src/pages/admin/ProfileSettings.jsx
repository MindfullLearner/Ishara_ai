
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  logoutUser,
  updateCurrentUserProfile,
  changeCurrentUserPassword,
} from "../../api/auth";
import "./ProfileSettings.css";

const DEFAULT_SETTINGS = {
  fullName: "",
  email: "",
  largerText: false,
  reduceMotion: true,
  diagnosticSharing: false,
};

function loadSettings(user) {
  try {
    const storedSettings = localStorage.getItem("isharaAdminSettings");
    const parsedSettings = storedSettings ? JSON.parse(storedSettings) : {};

    return {
      ...DEFAULT_SETTINGS,
      ...parsedSettings,
      fullName: user?.full_name || parsedSettings.fullName || "",
      email: user?.email || parsedSettings.email || "",
    };
  } catch {
    return {
      ...DEFAULT_SETTINGS,
      fullName: user?.full_name || "",
      email: user?.email || "",
    };
  }
}

function ProfileSettings() {
  const navigate = useNavigate();
  const user = useOutletContext();

  const [settings, setSettings] = useState(() => loadSettings(user));
  const [savedSettings, setSavedSettings] = useState(() => loadSettings(user));

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [saving, setSaving] = useState(false);

  const handleSettingChange = (event) => {
    const { name, value } = event.target;

    setSettings((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
  };

  const handleToggle = (name) => {
    setSettings((previous) => ({
      ...previous,
      [name]: !previous[name],
    }));

    setMessage("");
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
  };

  const togglePasswordVisibility = (name) => {
    setShowPasswords((previous) => ({
      ...previous,
      [name]: !previous[name],
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!settings.fullName.trim()) {
      setMessageType("error");
      setMessage("Please enter your full name.");
      return;
    }

    if (!settings.email.trim()) {
      setMessageType("error");
      setMessage("Please enter your email address.");
      return;
    }

    const changingPassword =
      passwords.currentPassword ||
      passwords.newPassword ||
      passwords.confirmPassword;

    if (changingPassword) {
      if (
        !passwords.currentPassword ||
        !passwords.newPassword ||
        !passwords.confirmPassword
      ) {
        setMessageType("error");
        setMessage("Please complete all three password fields.");
        return;
      }

      if (passwords.newPassword.length < 8) {
        setMessageType("error");
        setMessage("Your new password must contain at least 8 characters.");
        return;
      }

      if (!/[A-Z]/.test(passwords.newPassword)) {
        setMessageType("error");
        setMessage("Your new password must contain at least one uppercase letter.");
        return;
      }

      if (!/\d/.test(passwords.newPassword)) {
        setMessageType("error");
        setMessage("Your new password must contain at least one number.");
        return;
      }

      if (passwords.newPassword !== passwords.confirmPassword) {
        setMessageType("error");
        setMessage("New password and confirm password do not match.");
        return;
      }
    }

    setSaving(true);
    setMessage("");

    try {
      // Save personal information in the backend.
      const updatedUser = await updateCurrentUserProfile({
        full_name: settings.fullName.trim(),
        email: settings.email.trim().toLowerCase(),
      });

      // Save accessibility and privacy preferences locally.
      const preferences = {
        largerText: settings.largerText,
        reduceMotion: settings.reduceMotion,
        diagnosticSharing: settings.diagnosticSharing,
      };

      localStorage.setItem(
        "isharaAdminSettings",
        JSON.stringify({
          ...settings,
          ...preferences,
        })
      );

      // If the email changed, verification is required.
      if (updatedUser.is_verified === false) {
        window.alert(
          "Your profile has been updated. Please verify your new email address using the verification link sent to your inbox. You will need to log in again after verification."
        );

        logoutUser();
        navigate("/login", { replace: true });
        return;
      }

      // Change password only when requested.
      if (changingPassword) {
        await changeCurrentUserPassword({
          current_password: passwords.currentPassword,
          new_password: passwords.newPassword,
        });
      }

      const updatedSettings = {
        ...settings,
        fullName: updatedUser.full_name,
        email: updatedUser.email,
      };

      setSettings(updatedSettings);
      setSavedSettings(updatedSettings);

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessageType("success");
      setMessage(
        changingPassword
          ? "Your profile, password and preferences have been saved successfully."
          : "Your profile and preferences have been saved successfully."
      );

    } catch (error) {
      setMessageType("error");
      setMessage(
        error.message || "Unable to save your changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings(savedSettings);

    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setMessage("");
  };

  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to log out?"
    );

    if (confirmed) {
      logoutUser();
      navigate("/login", { replace: true });
    }
  };

  const isDirty =
    JSON.stringify(settings) !== JSON.stringify(savedSettings) ||
    Boolean(
      passwords.currentPassword ||
      passwords.newPassword ||
      passwords.confirmPassword
    );

  return (
    <div className="profile-settings-page">
      <div className="profile-settings-heading">
        <h1>Profile &amp; settings</h1>
        <p>
          Manage your personal details, account security and accessibility
          preferences.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <div className="profile-settings-grid">
          <div className="profile-settings-left">

            {/* Personal Information */}
            <section className="profile-settings-card">
              <div className="profile-card-heading">
                <h2>Personal information</h2>
                <span className="profile-admin-badge">
                  <span>●</span> Admin
                </span>
              </div>

              <p className="profile-card-description">
                Your administrator profile.
              </p>

              <div className="profile-field">
                <label htmlFor="profile-full-name">
                  Full name <span>*</span>
                </label>

                <input
                  id="profile-full-name"
                  type="text"
                  name="fullName"
                  value={settings.fullName}
                  onChange={handleSettingChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-email">
                  Email address <span>*</span>
                </label>

                <input
                  id="profile-email"
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleSettingChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <p className="profile-field-hint">
                Used for sign-in and account recovery.
              </p>
            </section>

            {/* Account & Password */}
            <section className="profile-settings-card">
              <div className="profile-card-heading">
                <h2>Account &amp; password</h2>
              </div>

              <p className="profile-card-description">
                Leave these fields blank to keep your current password.
              </p>

              <div className="profile-field">
                <label htmlFor="current-password">
                  Current password
                </label>

                <div className="profile-password-input">
                  <input
                    id="current-password"
                    type={
                      showPasswords.currentPassword ? "text" : "password"
                    }
                    name="currentPassword"
                    value={passwords.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      togglePasswordVisibility("currentPassword")
                    }
                    aria-label="Toggle current password visibility"
                  >
                    {showPasswords.currentPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="profile-password-grid">
                <div className="profile-field">
                  <label htmlFor="new-password">
                    New password
                  </label>

                  <div className="profile-password-input">
                    <input
                      id="new-password"
                      type={showPasswords.newPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwords.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Create a password"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("newPassword")}
                      aria-label="Toggle new password visibility"
                    >
                      {showPasswords.newPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="profile-field">
                  <label htmlFor="confirm-password">
                    Confirm new password
                  </label>

                  <div className="profile-password-input">
                    <input
                      id="confirm-password"
                      type={
                        showPasswords.confirmPassword ? "text" : "password"
                      }
                      name="confirmPassword"
                      value={passwords.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        togglePasswordVisibility("confirmPassword")
                      }
                      aria-label="Toggle confirm password visibility"
                    >
                      {showPasswords.confirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              <p className="profile-field-hint">
                Use at least 8 characters, including 1 uppercase letter and
                1 number. Both new passwords must match.
              </p>
            </section>
          </div>

          <div className="profile-settings-right">

            {/* Accessibility */}
            <section className="profile-settings-card">
              <div className="profile-card-heading">
                <h2>Accessibility</h2>
              </div>

              <div className="profile-toggle-row">
                <div>
                  <h3>Larger text</h3>
                  <p>Increase text size across your workspace.</p>
                </div>

                <button
                  type="button"
                  className={`profile-switch ${
                    settings.largerText ? "on" : ""
                  }`}
                  onClick={() => handleToggle("largerText")}
                  role="switch"
                  aria-checked={settings.largerText}
                  aria-label="Larger text"
                >
                  <span />
                  <small>{settings.largerText ? "On" : "Off"}</small>
                </button>
              </div>

              <div className="profile-toggle-row">
                <div>
                  <h3>Reduce motion</h3>
                  <p>Prefer still states and limit non-essential movement.</p>
                </div>

                <button
                  type="button"
                  className={`profile-switch ${
                    settings.reduceMotion ? "on" : ""
                  }`}
                  onClick={() => handleToggle("reduceMotion")}
                  role="switch"
                  aria-checked={settings.reduceMotion}
                  aria-label="Reduce motion"
                >
                  <span />
                  <small>{settings.reduceMotion ? "On" : "Off"}</small>
                </button>
              </div>

              <div className="profile-info-box">
                <span className="profile-info-icon">ⓘ</span>
                <div>
                  <h3>Visual status, always</h3>
                  <p>
                    Important messages use readable text and icons, not colour
                    or sound alone.
                  </p>
                </div>
              </div>
            </section>

            {/* Privacy */}
            <section className="profile-settings-card">
              <div className="profile-card-heading">
                <h2>Privacy</h2>
              </div>

              <div className="profile-toggle-row">
                <div>
                  <h3>Optional diagnostic sharing</h3>
                  <p>
                    Share technical error details to help troubleshoot.
                    Off by default; no video content is included.
                  </p>
                </div>

                <button
                  type="button"
                  className={`profile-switch ${
                    settings.diagnosticSharing ? "on" : ""
                  }`}
                  onClick={() => handleToggle("diagnosticSharing")}
                  role="switch"
                  aria-checked={settings.diagnosticSharing}
                  aria-label="Optional diagnostic sharing"
                >
                  <span />
                  <small>{settings.diagnosticSharing ? "On" : "Off"}</small>
                </button>
              </div>

              <div className="profile-privacy-note">
                Only share sign recordings with permission. Your password
                is never visible to other admins.
              </div>

              <a
                href="/privacy-policy"
                className="profile-privacy-link"
                onClick={(event) => {
                  event.preventDefault();
                  setMessageType("info");
                  setMessage("Privacy policy page will be added separately.");
                }}
              >
                Read the Privacy Policy
              </a>
            </section>

            {/* Session */}
            <section className="profile-settings-card profile-session-card">
              <div className="profile-card-heading">
                <h2>Session</h2>
              </div>

              <p>
                Sign out of this administrator session when you are finished,
                especially on a shared device.
              </p>

              <button
                type="button"
                className="profile-logout-btn"
                onClick={handleLogout}
              >
                <span>↪</span> Log out
              </button>
            </section>
          </div>
        </div>

        {message && (
          <div
            className={`profile-feedback ${messageType}`}
            role="status"
          >
            {message}
          </div>
        )}

        <div className="profile-settings-footer">
          <span>
            Changes apply after you save.
          </span>

          <div>
            <button
              type="button"
              className="profile-cancel-btn"
              onClick={handleCancel}
              disabled={!isDirty || saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="profile-save-btn"
              disabled={!isDirty || saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ProfileSettings;
