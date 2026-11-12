
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUsers } from "../../api/admin";
import "./UserManagement.css";

const USERS_PER_PAGE = 8;

function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function UserManagement() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [retry, setRetry] = useState(0);

  function formatUsers(data) {
    return data.map((user) => ({
        id: user.id,
        name: user.full_name || user.email,
        email: user.email,
        role: user.role === "admin" ? "Admin" : "User",
        // Pending means email verification is still outstanding. Account
        // access status itself is only active or suspended in this API.
        status: user.status === "suspended"
          ? "Suspended"
          : user.is_verified
            ? "Active"
            : "Pending",
        joined: formatDate(user.created_at),
      }));
  }

  useEffect(() => {
    let active = true;
    getAllUsers()
      .then((data) => {
        if (active) {
          setUsers(formatUsers(data));
          setError("");
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load users.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retry]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchMatch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const roleMatch =
        roleFilter === "All" || user.role === roleFilter;

      const statusMatch =
        statusFilter === "All" || user.status === statusFilter;

      return searchMatch && roleMatch && statusMatch;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / USERS_PER_PAGE)
  );

  const visibleUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  function updateSearch(value) {
    setSearch(value);
    setCurrentPage(1);
  }

  function updateRole(value) {
    setRoleFilter(value);
    setCurrentPage(1);
  }

  function updateStatus(value) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  return (
    <div className="user-management">
      <div className="users-page-heading">
        <div>
          <h1>User management</h1>
          <p>
            Review accounts, roles and access status.
          </p>
        </div>

        <button
          className="users-add-button"
          onClick={() => navigate("/admin/users/add")}
        >
          + Add user
        </button>
      </div>

      {/* Search and filters */}

      <div className="users-toolbar">
        <div className="users-search">
          <label htmlFor="user-search">Search users</label>

          <input
            id="user-search"
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
          />
        </div>

        <div className="users-filter-group">
          {["All", "Admin", "User"].map((role) => (
            <button
              key={role}
              className={`users-filter-button ${
                roleFilter === role ? "selected" : ""
              }`}
              onClick={() => updateRole(role)}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="users-filter-group">
          {["All", "Active", "Pending", "Suspended"].map((status) => (
            <button
              key={status}
              className={`users-filter-button ${
                statusFilter === status ? "selected" : ""
              }`}
              onClick={() => updateStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}

      <div className="users-table-container">
        <div className="users-table-scroll">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="users-empty">
                    Loading users...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="users-empty">
                    <p>{error}</p>

                    <button onClick={() => { setLoading(true); setRetry((value) => value + 1); }}>
                      Try again
                    </button>
                  </td>
                </tr>
              ) : visibleUsers.length > 0 ? (
                visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="users-user-info">
                        <div className="users-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <strong>{user.name}</strong>
                          <small>ID: {user.id}</small>
                        </div>
                      </div>
                    </td>

                    <td className="users-email">
                      {user.email}
                    </td>

                    <td>
                      <span
                        className={`users-role-badge ${
                          user.role === "Admin" ? "admin-role" : ""
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`users-status-badge ${user.status.toLowerCase()}`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td className="users-joined">
                      {user.joined}
                    </td>

                    <td>
                      <div className="users-row-actions">
                        <button
                          onClick={() =>
                            navigate(`/admin/users/edit/${user.id}`)
                          }
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/admin/users/edit/${user.id}`)
                          }
                        >
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="users-empty">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}

        {!loading && !error && (
          <div className="users-pagination">
            <span>
              Showing{" "}
              {filteredUsers.length === 0
                ? 0
                : (currentPage - 1) * USERS_PER_PAGE + 1}
              –
              {Math.min(
                currentPage * USERS_PER_PAGE,
                filteredUsers.length
              )}{" "}
              of {filteredUsers.length} users
            </span>

            <div className="users-pagination-buttons">
              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => page - 1)
                }
              >
                ‹
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((page) => (
                <button
                  key={page}
                  className={
                    currentPage === page ? "current" : ""
                  }
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => page + 1)
                }
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;
