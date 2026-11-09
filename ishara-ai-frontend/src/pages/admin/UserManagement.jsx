import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserManagement.css";

const SAMPLE_USERS = [
  { id: "US-1042", name: "Ayesha Khan", email: "ayesha.khan@ishara.ai", role: "Admin", status: "Active", joined: "Oct 2026" },
  { id: "US-1043", name: "Bilal Ahmed", email: "bilal.ahmed@ishara.ai", role: "User", status: "Active", joined: "Oct 2026" },
  { id: "US-1044", name: "Sara Malik", email: "sara.malik@ishara.ai", role: "User", status: "Pending", joined: "Oct 2026" },
  { id: "US-1045", name: "Hamza Ali", email: "hamza.ali@ishara.ai", role: "User", status: "Suspended", joined: "Sep 2026" },
  { id: "US-1046", name: "Fatima Hassan", email: "fatima.hassan@ishara.ai", role: "Admin", status: "Active", joined: "Sep 2026" },
  { id: "US-1047", name: "Omar Saeed", email: "omar.saeed@ishara.ai", role: "User", status: "Active", joined: "Aug 2026" },
  { id: "US-1048", name: "Nida Iqbal", email: "nida.iqbal@ishara.ai", role: "User", status: "Pending", joined: "Aug 2026" },
  { id: "US-1049", name: "Rahul Patel", email: "rahul.patel@ishara.ai", role: "Admin", status: "Active", joined: "Jul 2026" },
  { id: "US-1050", name: "Zara Noor", email: "zara.noor@ishara.ai", role: "User", status: "Active", joined: "Jul 2026" },
  { id: "US-1051", name: "Usman Tariq", email: "usman.tariq@ishara.ai", role: "User", status: "Pending", joined: "Jun 2026" },
  { id: "US-1052", name: "Mariam Shah", email: "mariam.shah@ishara.ai", role: "User", status: "Active", joined: "Jun 2026" },
  { id: "US-1053", name: "Daniyal Khan", email: "daniyal.khan@ishara.ai", role: "User", status: "Suspended", joined: "May 2026" },
];

const USERS_PER_PAGE = 8;

function UserManagement() {
  const navigate = useNavigate();

  const [users] = useState(SAMPLE_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

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
            Review accounts, roles and access status. - Example data
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
              {visibleUsers.length > 0 ? (
                visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="users-user-info">
                        <div className="users-avatar">
                          {user.name.charAt(0)}
                        </div>

                        <div>
                          <strong>{user.name}</strong>
                          <small>ID: {user.id}</small>
                        </div>
                      </div>
                    </td>

                    <td className="users-email">{user.email}</td>

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

                    <td className="users-joined">{user.joined}</td>

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

        <div className="users-pagination">
          <span>
            Showing{" "}
            {filteredUsers.length === 0
              ? 0
              : (currentPage - 1) * USERS_PER_PAGE + 1}
            –
            {Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length)} of{" "}
            {filteredUsers.length} users
          </span>

          <div className="users-pagination-buttons">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  className={currentPage === page ? "current" : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            )}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;