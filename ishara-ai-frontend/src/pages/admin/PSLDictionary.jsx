import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PSLDictionary.css";

const STORAGE_KEY = "isharaPSLSigns";

const INITIAL_SIGNS = [
  { id: 1, label: "HELLO", category: "Greetings", meaning: "Hello", date: "12 Mar 2026", status: "Reviewed" },
  { id: 2, label: "THANK YOU", category: "Greetings", meaning: "Thank you", date: "11 Mar 2026", status: "Draft" },
  { id: 3, label: "PLEASE", category: "Social", meaning: "Please", date: "09 Mar 2026", status: "Reviewed" },
  { id: 4, label: "GOOD MORNING", category: "Greetings", meaning: "Good morning", date: "08 Mar 2026", status: "Reviewed" },
  { id: 5, label: "WATER", category: "Food & drink", meaning: "Water", date: "07 Mar 2026", status: "Draft" },
  { id: 6, label: "RESTAURANT", category: "Travel", meaning: "Restaurant", date: "06 Mar 2026", status: "Reviewed" },
  { id: 7, label: "HOSPITAL", category: "Health", meaning: "Hospital", date: "05 Mar 2026", status: "Draft" },
  { id: 8, label: "GOODBYE", category: "Greetings", meaning: "Goodbye", date: "04 Mar 2026", status: "Reviewed" },
  { id: 9, label: "BREAD", category: "Food & drink", meaning: "Bread", date: "03 Mar 2026", status: "Draft" },
  { id: 10, label: "SCHOOL", category: "Education", meaning: "School", date: "02 Mar 2026", status: "Reviewed" },
  { id: 11, label: "HELP", category: "Social", meaning: "Help", date: "01 Mar 2026", status: "Reviewed" },
  { id: 12, label: "BUS", category: "Travel", meaning: "Bus", date: "28 Feb 2026", status: "Draft" },
  { id: 13, label: "DOCTOR", category: "Health", meaning: "Doctor", date: "27 Feb 2026", status: "Reviewed" },
  { id: 14, label: "APPLE", category: "Food & drink", meaning: "Apple", date: "26 Feb 2026", status: "Reviewed" },
  { id: 15, label: "FAMILY", category: "Social", meaning: "Family", date: "25 Feb 2026", status: "Draft" },
  { id: 16, label: "TRAIN", category: "Travel", meaning: "Train", date: "24 Feb 2026", status: "Reviewed" },
  { id: 17, label: "WATER PLEASE", category: "Food & drink", meaning: "Please give me water", date: "23 Feb 2026", status: "Draft" },
  { id: 18, label: "WELCOME", category: "Greetings", meaning: "Welcome", date: "22 Feb 2026", status: "Reviewed" },
  { id: 19, label: "BOOK", category: "Education", meaning: "Book", date: "21 Feb 2026", status: "Draft" },
  { id: 20, label: "POLICE", category: "Health", meaning: "Police", date: "20 Feb 2026", status: "Reviewed" },
  { id: 21, label: "MILK", category: "Food & drink", meaning: "Milk", date: "19 Feb 2026", status: "Draft" },
  { id: 22, label: "AIRPORT", category: "Travel", meaning: "Airport", date: "18 Feb 2026", status: "Reviewed" },
  { id: 23, label: "SORRY", category: "Social", meaning: "Sorry", date: "17 Feb 2026", status: "Draft" },
  { id: 24, label: "GOOD NIGHT", category: "Greetings", meaning: "Good night", date: "16 Feb 2026", status: "Reviewed" },
];

const FILTERS = ["All", "Greetings", "Food", "Travel", "Draft", "Reviewed"];

function loadSigns() {
  try {
    const savedSigns = localStorage.getItem(STORAGE_KEY);

    if (savedSigns) {
      const parsedSigns = JSON.parse(savedSigns);
      if (Array.isArray(parsedSigns)) return parsedSigns;
    }
  } catch (error) {
    console.error("Could not load PSL signs:", error);
  }

  return INITIAL_SIGNS;
}

function getToday() {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PSLDictionary() {
  const navigate = useNavigate();

  const [signs, setSigns] = useState(loadSigns);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const entriesPerPage = 7;

  // Save dictionary changes in localStorage.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signs));
  }, [signs]);

  const filteredSigns = useMemo(() => {
    return signs.filter((sign) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        (sign.label || "").toLowerCase().includes(searchText) ||
        (sign.meaning || "").toLowerCase().includes(searchText);

      let matchesFilter = true;

      if (activeFilter === "Food") {
        matchesFilter = sign.category === "Food & drink";
      } else if (activeFilter === "Draft" || activeFilter === "Reviewed") {
        matchesFilter = sign.status === activeFilter;
      } else if (activeFilter !== "All") {
        matchesFilter = sign.category === activeFilter;
      }

      return matchesSearch && matchesFilter;
    });
  }, [signs, search, activeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSigns.length / entriesPerPage)
  );

  const visibleSigns = filteredSigns.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handleStatusUpdate = (id) => {
    setSigns((previous) =>
      previous.map((sign) =>
        sign.id === id
          ? {
              ...sign,
              status: sign.status === "Reviewed" ? "Draft" : "Reviewed",
              date: getToday(),
            }
          : sign
      )
    );
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this sign entry?"
    );

    if (!confirmed) return;

    const updatedSigns = signs.filter((sign) => sign.id !== id);

    setSigns(updatedSigns);

    const remainingFilteredCount = updatedSigns.filter((sign) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        (sign.label || "").toLowerCase().includes(searchText) ||
        (sign.meaning || "").toLowerCase().includes(searchText);

      let matchesFilter = true;

      if (activeFilter === "Food") {
        matchesFilter = sign.category === "Food & drink";
      } else if (activeFilter === "Draft" || activeFilter === "Reviewed") {
        matchesFilter = sign.status === activeFilter;
      } else if (activeFilter !== "All") {
        matchesFilter = sign.category === activeFilter;
      }

      return matchesSearch && matchesFilter;
    }).length;

    const newTotalPages = Math.max(
      1,
      Math.ceil(remainingFilteredCount / entriesPerPage)
    );

    setCurrentPage((page) => Math.min(page, newTotalPages));
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="psl-dictionary-page">
      <div className="psl-page-heading">
        <div>
          <h1>PSL sign dictionary</h1>
          <p>
            Manage approved signs, glosses, video references and review
            status.
          </p>
        </div>

        <button
          className="psl-primary-btn"
          onClick={() => navigate("/admin/psl-dictionary/add")}
        >
          + Add sign entry
        </button>
      </div>

      <div className="psl-search-section">
        <label htmlFor="psl-search">Search signs</label>

        <div className="psl-search-and-filters">
          <input
            id="psl-search"
            type="text"
            placeholder="Search sign or English meaning"
            value={search}
            onChange={handleSearchChange}
          />

          <div className="psl-filter-buttons">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                className={activeFilter === filter ? "active" : ""}
                onClick={() => handleFilterChange(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="psl-table-card">
        <div className="psl-table-wrapper">
          <table className="psl-table">
            <thead>
              <tr>
                <th>Sign label</th>
                <th>Category</th>
                <th>Update date</th>
                <th>Review status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibleSigns.length > 0 ? (
                visibleSigns.map((sign) => (
                  <tr key={sign.id}>
                    <td className="psl-sign-label">{sign.label}</td>
                    <td>{sign.category}</td>
                    <td>{sign.date}</td>
                    <td>
                      <span
                        className={`psl-status-badge ${
                          sign.status.toLowerCase().startsWith("draft")
                            ? "draft"
                            : "reviewed"
                        }`}
                      >
                        {sign.status}
                      </span>
                    </td>
                    <td>
                      <div className="psl-action-buttons">
                        <button
                          className="psl-action-btn"
                          onClick={() =>
                            navigate(`/admin/psl-dictionary/edit/${sign.id}`)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="psl-action-btn"
                          onClick={() => handleStatusUpdate(sign.id)}
                        >
                          Update
                        </button>

                        <button
                          className="psl-action-btn delete"
                          onClick={() => handleDelete(sign.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="psl-empty-state">
                    No sign entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="psl-table-footer">
          <span>
            Showing{" "}
            {filteredSigns.length === 0
              ? 0
              : (currentPage - 1) * entriesPerPage + 1}
            –
            {Math.min(currentPage * entriesPerPage, filteredSigns.length)} of{" "}
            {filteredSigns.length} entries
          </span>

          <div className="psl-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .slice(0, 5)
              .map((page) => (
                <button
                  key={page}
                  className={currentPage === page ? "active" : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="psl-data-note">
        <span className="psl-note-dot"></span>
        Example data · Media pending validated asset
      </div>
    </div>
  );
}

export default PSLDictionary;