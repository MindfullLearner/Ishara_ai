
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AddUser.css";

function AddUser() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "User",
    status: "Invited",
  });

  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!formData.fullName.trim() || !formData.email.trim()) {
      setMessage("Please complete all required fields.");
      return;
    }

    setMessage(
      "Form validated successfully. User creation will be connected to the backend later."
    );
  }

  return (
    <div className="add-user-page">
      <div className="add-user-breadcrumb">
        <Link to="/admin/users">← Users</Link>
      </div>

      <div className="add-user-heading">
        <h1>Add user</h1>
        <p>Create an account and invite someone to Ishara AI.</p>
      </div>

      <div className="add-user-layout">
        {/* User details form */}

        <section className="add-user-card">
          <h3>User details</h3>

          <p className="add-user-description">
            Use the person's preferred name and an email address they can access.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="add-user-field">
              <label htmlFor="fullName">Full name *</label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter full name"
                value={formData.fullName}
                onChange={handleChange}
                maxLength={100}
                required
              />

              <small>
                Required. Enter a name, not an account ID.
              </small>
            </div>

            <div className="add-user-field">
              <label htmlFor="email">Email address *</label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                maxLength={254}
                required
              />

              <small>
                Use a valid, unique email address. An invitation will be sent
                when email functionality is implemented.
              </small>
            </div>

            <div className="add-user-select-row">
              <div className="add-user-field">
                <label htmlFor="role">Role *</label>

                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>

                <small>User access is the default.</small>
              </div>

              <div className="add-user-field">
                <label htmlFor="status">Account status *</label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Invited">Invited</option>
                  <option value="Active">Active</option>
                </select>

                <small>
                  Activation follows the invitation.
                </small>
              </div>
            </div>

            <div className="add-user-info">
              <span>ⓘ</span>
              <p>
                <strong>An invitation, not a shared password</strong>
                Creating this user sends an invitation to set their own
                password. Confirm the address before continuing.
              </p>
            </div>

            {message && (
              <p className="add-user-message" role="status">
                {message}
              </p>
            )}

            <div className="add-user-form-footer">
              <span>* Required fields</span>

              <div>
                <button
                  type="button"
                  className="add-user-cancel"
                  onClick={() => navigate("/admin/users")}
                >
                  Cancel
                </button>

                <button type="submit" className="add-user-submit">
                  Create user
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Access permissions */}

        <aside className="add-user-sidebar">
          <section className="add-user-card permission-card">
            <h3>Choose access carefully</h3>

            <div className="permission-item">
              <strong>User</strong>
              <p>
                Can record or upload signing videos and review their own
                translation history.
              </p>
            </div>

            <div className="permission-item">
              <strong>Admin</strong>
              <p>
                Can manage users, dictionary drafts, knowledge articles and
                processing activity.
              </p>
            </div>
          </section>

          <section className="add-user-warning">
            <span>⚠</span>

            <div>
              <strong>Before you create</strong>
              <p>
                Check spelling, email and role. Only grant admin access to
                someone authorized to manage the platform.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default AddUser;
