
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EditUser.css";

const SAMPLE_USERS = [
  {
    id: "US-1042",
    name: "Ayesha Khan",
    email: "ayesha.khan@ishara.ai",
    role: "Admin",
    status: "Active",
    joined: "29 October 2026",
  },
  {
    id: "US-1043",
    name: "Bilal Ahmed",
    email: "bilal.ahmed@ishara.ai",
    role: "User",
    status: "Active",
    joined: "29 October 2026",
  },
  {
    id: "US-1044",
    name: "Sara Malik",
    email: "sara.malik@ishara.ai",
    role: "User",
    status: "Pending",
    joined: "28 October 2026",
  },
  {
    id: "US-1045",
    name: "Hamza Ali",
    email: "hamza.ali@ishara.ai",
    role: "User",
    status: "Suspended",
    joined: "25 September 2026",
  },
];

function EditUser() {
  const { userId } = useParams();
  const navigate = useNavigate();

  // Find user using the URL parameter.
  const selectedUser = SAMPLE_USERS.find(
    (user) => user.id === userId
  );

  const [name, setName] = useState(selectedUser?.name || "");
  const [email, setEmail] = useState(selectedUser?.email || "");
  const [role, setRole] = useState(selectedUser?.role || "User");
  const [status, setStatus] = useState(selectedUser?.status || "Active");
  const [message, setMessage] = useState("");

  if (!selectedUser) {
    return (
      <div className="edit-user-page">
        <h2>User not found</h2>
        <button onClick={() => navigate("/admin/users")}>
          Back to users
        </button>
      </div>
    );
  }

  function handleSave(event) {
    event.preventDefault();

    setMessage("Changes saved successfully! (Preview only)");
  }

  function handleSuspend() {
    if (status === "Suspended") {
      setStatus("Active");
      setMessage("Account marked as Active (Preview only).");
    } else {
      setStatus("Suspended");
      setMessage("Account marked as Suspended (Preview only).");
    }
  }

  return (
    <div className="edit-user-page">

      {/* Page heading */}

      <div className="edit-user-heading">
        <div>
          <button
            className="edit-user-back"
            type="button"
            onClick={() => navigate("/admin/users")}
          >
            ← Users
          </button>

          <h1>Edit user</h1>

          <p>
            Update account details and access for {selectedUser.name}.
          </p>
        </div>
      </div>

      <div className="edit-user-layout">

        {/* User details form */}

        <form className="edit-user-card" onSubmit={handleSave}>

          <div className="edit-user-card-heading">
            <div>
              <h3>User details</h3>
              <p>
                User ID: {selectedUser.id} • Joined {selectedUser.joined}
              </p>
            </div>

            <span
              className={`edit-user-current-status ${status.toLowerCase()}`}
            >
              ● {status}
            </span>
          </div>

          <div className="edit-user-field">
            <label htmlFor="edit-name">Full name *</label>

            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setMessage("");
              }}
              required
            />
          </div>

          <div className="edit-user-field">
            <label htmlFor="edit-email">Email address *</label>

            <input
              id="edit-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setMessage("");
              }}
              required
            />

            <small>
              Changing the email changes where account messages are sent.
            </small>
          </div>

          <div className="edit-user-select-row">

            <div className="edit-user-field">
              <label htmlFor="edit-role">Role *</label>

              <select
                id="edit-role"
                value={role}
                onChange={(event) => {
                  setRole(event.target.value);
                  setMessage("");
                }}
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="edit-user-field">
              <label htmlFor="edit-status">Account status *</label>

              <select
                id="edit-status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setMessage("");
                }}
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

          </div>

          <div className="edit-user-info">
            <span>ⓘ</span>
            <div>
              <strong>Review account changes</strong>
              <p>
                A role change affects what this person can access.
                Suspending an account prevents sign-in without deleting
                the account.
              </p>
            </div>
          </div>

          {message && (
            <p className="edit-user-message" role="status">
              {message}
            </p>
          )}

          <div className="edit-user-form-footer">
            <span>* Required fields</span>

            <div>
              <button
                type="button"
                className="edit-user-cancel"
                onClick={() => navigate("/admin/users")}
              >
                Cancel
              </button>

              <button type="submit" className="edit-user-save">
                Save changes
              </button>
            </div>
          </div>

        </form>

        {/* Right side cards */}

        <div className="edit-user-sidebar">

          <div className="edit-user-side-card">
            <h3>Manage account</h3>

            <p>
              Temporarily prevent access if this account should no longer
              sign in. Existing records are kept.
            </p>

            <button
              className={`edit-user-suspend ${
                status === "Suspended" ? "activate" : ""
              }`}
              type="button"
              onClick={handleSuspend}
            >
              {status === "Suspended"
                ? "Activate account"
                : "Suspend account"}
            </button>

            <small>
              You will be asked to confirm before the status changes
              in the live system.
            </small>
          </div>

          <div className="edit-user-side-card">
            <h3>Role permissions</h3>

            <p>
              {role === "Admin"
                ? "This user can manage users, dictionary drafts, knowledge articles and processing activity."
                : "This user can translate videos and view their own translation history. They do not have administration access."}
            </p>

            <strong className="edit-user-role-label">
              Current role: {role}
            </strong>
          </div>

        </div>

      </div>
    </div>
  );
}

export default EditUser;
