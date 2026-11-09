
import { useMemo, useState } from "react";
import "./PSLDictionary.css";

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

const EMPTY_FORM = {
  label: "",
  category: "Greetings",
  meaning: "",
  status: "Draft",
};

function PSLDictionary() {
  const [signs, setSigns] = useState(INITIAL_SIGNS);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSign, setEditingSign] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const entriesPerPage = 7;

  const filteredSigns = useMemo(() => {
    return signs.filter((sign) => {
      const matchesSearch =
        sign.label.toLowerCase().includes(search.toLowerCase()) ||
        sign.meaning.toLowerCase().includes(search.toLowerCase());

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

  const openAddModal = () => {
    setEditingSign(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (sign) => {
    setEditingSign(sign);
    setFormData({
      label: sign.label,
      category: sign.category,
      meaning: sign.meaning,
      status: sign.status,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSign(null);
    setFormData(EMPTY_FORM);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = (event) => {
    event.preventDefault();

    if (editingSign) {
      setSigns((previous) =>
        previous.map((sign) =>
          sign.id === editingSign.id
            ? { ...sign, ...formData, date: "09 Nov 2026" }
            : sign
        )
      );
    } else {
      const newSign = {
        id: Date.now(),
        ...formData,
        date: "09 Nov 2026",
      };

      setSigns((previous) => [newSign, ...previous]);
      setCurrentPage(1);
      setActiveFilter("All");
      setSearch("");
    }

    closeModal();
  };

  const handleStatusUpdate = (id) => {
    setSigns((previous) =>
      previous.map((sign) =>
        sign.id === id
          ? {
              ...sign,
              status: sign.status === "Reviewed" ? "Draft" : "Reviewed",
              date: "09 Nov 2026",
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

    setSigns((previous) => previous.filter((sign) => sign.id !== id));
    setCurrentPage((page) =>
      Math.min(page, Math.max(1, Math.ceil((filteredSigns.length - 1) / entriesPerPage)))
    );
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
            status. - Example data
          </p>
        </div>

        <button className="psl-primary-btn" onClick={openAddModal}>
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
                        className={`psl-status-badge ${sign.status.toLowerCase()}`}
                      >
                        {sign.status}
                      </span>
                    </td>
                    <td>
                      <div className="psl-action-buttons">
                        <button
                          className="psl-action-btn"
                          onClick={() => openEditModal(sign)}
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
            Showing {filteredSigns.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1}
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

      {modalOpen && (
        <div className="psl-modal-overlay" onClick={closeModal}>
          <div
            className="psl-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="psl-modal-heading">
              <h2>{editingSign ? "Edit sign entry" : "Add sign entry"}</h2>
              <button type="button" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSave}>
              <label htmlFor="sign-label">Sign label</label>
              <input
                id="sign-label"
                name="label"
                value={formData.label}
                onChange={handleFormChange}
                placeholder="e.g. HELLO"
                required
              />

              <label htmlFor="sign-meaning">English meaning</label>
              <input
                id="sign-meaning"
                name="meaning"
                value={formData.meaning}
                onChange={handleFormChange}
                placeholder="Enter English meaning"
                required
              />

              <label htmlFor="sign-category">Category</label>
              <select
                id="sign-category"
                name="category"
                value={formData.category}
                onChange={handleFormChange}
              >
                <option>Greetings</option>
                <option>Food & drink</option>
                <option>Travel</option>
                <option>Social</option>
                <option>Health</option>
                <option>Education</option>
              </select>

              <label htmlFor="sign-status">Review status</label>
              <select
                id="sign-status"
                name="status"
                value={formData.status}
                onChange={handleFormChange}
              >
                <option>Draft</option>
                <option>Reviewed</option>
              </select>

              <div className="psl-modal-actions">
                <button
                  type="button"
                  className="psl-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="psl-primary-btn">
                  Save entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PSLDictionary;
