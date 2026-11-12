import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminDemoNotice from "../../../components/admin/AdminDemoNotice";
import "./PSLSignForm.css";

const STORAGE_KEY = "isharaPSLSigns";

const CATEGORIES = [
  "Everyday communication",
  "Greetings",
  "Food & drink",
  "Travel",
  "Social",
  "Health",
  "Education",
];

const EMPTY_FORM = {
  label: "",
  category: "Everyday communication",
  referenceMedia: null,
  referenceMediaName: "",
  notes: "",
  status: "Draft",
};

function PSLSignForm({ mode = "add", sign = null }) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [formData, setFormData] = useState(() =>
    isEdit && sign
      ? {
          label: sign.label || "",
          category: sign.category || "Everyday communication",
          referenceMedia: sign.referenceMedia || null,
          referenceMediaName: sign.referenceMediaName || "",
          notes: sign.notes || "",
          status: sign.status || "Draft",
        }
      : EMPTY_FORM
  );
  const [mediaError, setMediaError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleMediaChange = (event) => {
    const file = event.target.files?.[0];

    setMediaError("");

    if (!file) return;

    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];

    if (!allowedTypes.includes(file.type)) {
      setMediaError("Please select an MP4, WEBM, or MOV video.");
      event.target.value = "";
      return;
    }

    setFormData((previous) => ({
      ...previous,
      referenceMedia: null,
      referenceMediaName: file.name,
    }));
  };

  const handleRemoveMedia = () => {
    setFormData((previous) => ({
      ...previous,
      referenceMedia: null,
      referenceMediaName: "",
    }));

    const fileInput = document.getElementById("psl-reference-media");
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.label.trim()) {
      alert("Please enter an English gloss.");
      return;
    }

    if (!isEdit && !formData.referenceMediaName) {
        setMediaError("Reference media is required.");
        return;
    }

    const savedSigns = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    const today = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    if (isEdit) {
      const updatedSigns = savedSigns.map((item) =>
        String(item.id) === String(sign.id)
          ? {
              ...item,
              ...formData,
              date: today,
              status: "Draft",
            }
          : item
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSigns));
    } else {
      const newSign = {
        id: Date.now(),
        ...formData,
        date: today,
        status: "Draft",
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([newSign, ...savedSigns])
      );
    }

    navigate("/admin/psl-dictionary");
  };

  return (
    <div className="psl-form-page">
      <AdminDemoNotice>
        Sign entries and media are saved in this browser only and are not sent to a backend API.
      </AdminDemoNotice>
      <div className="psl-form-breadcrumb">
        <button
          type="button"
          onClick={() => navigate("/admin/psl-dictionary")}
        >
          ← PSL dictionary
        </button>
      </div>

      <div className="psl-form-page-heading">
        <h1>{isEdit ? "Edit PSL sign" : "Add PSL sign"}</h1>
        <p>
          {isEdit
            ? "Update the draft reference and reviewer notes. This example has not been validated."
            : "Prepare a dictionary draft with a traceable reference. Saving does not approve a sign."}
        </p>
      </div>

      <div className="psl-form-layout">
        <form className="psl-sign-form-card" onSubmit={handleSubmit}>
          <div className="psl-form-card-heading">
            <h2>Sign entry</h2>
            <span className={`psl-form-status ${isEdit ? "unvalidated" : ""}`}>
              {isEdit ? "● Draft - Not validated" : "● Draft"}
            </span>
          </div>

          {isEdit && (
            <p className="psl-sign-reference">
              PSL-SIGN-{String(sign?.id || "").padStart(4, "0")} · Example draft
            </p>
          )}

          <div className="psl-form-fields-row">
            <div className="psl-form-field">
              <label htmlFor="psl-label">
                Label / English gloss <span>*</span>
              </label>
              <input
                id="psl-label"
                name="label"
                value={formData.label}
                onChange={handleChange}
                placeholder="Enter an English meaning"
                required
              />
            </div>

            <div className="psl-form-field">
              <label htmlFor="psl-category">
                Category <span>*</span>
              </label>
              <select
                id="psl-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="psl-form-field psl-media-field">
            <label>
              Reference media <span>*</span>
            </label>

            {isEdit && formData.referenceMediaName ? (
              <div className="psl-existing-media">
                <div className="psl-media-file-icon">▣</div>
                <div className="psl-media-file-info">
                  <strong>{formData.referenceMediaName}</strong>
                  <span>Sample file · Reference media</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="psl-remove-media"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="psl-upload-area" htmlFor="psl-reference-media">
                <span className="psl-upload-icon">↑</span>
                <strong>Attach a PSL reference video</strong>
                <small>
                  Use media with permission from the signer. No sample
                  gestures are provided.
                </small>
                <span className="psl-choose-file">Choose reference media</span>
                <input
                  id="psl-reference-media"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleMediaChange}
                />
              </label>
            )}

            {isEdit && (
              <label className="psl-replace-media" htmlFor="psl-reference-media">
                Replace reference media
                <input
                  id="psl-reference-media"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleMediaChange}
                />
              </label>
            )}

            {formData.referenceMediaName && !isEdit && (
              <div className="psl-selected-file">
                <span>Selected: {formData.referenceMediaName}</span>
                <button type="button" onClick={handleRemoveMedia}>
                  Remove
                </button>
              </div>
            )}

            {mediaError && (
              <p className="psl-form-error">{mediaError}</p>
            )}
          </div>

          <div className="psl-form-field psl-notes-field">
            <label htmlFor="psl-notes">Notes for reviewers</label>
            <textarea
              id="psl-notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Describe the signer, permission, region or context, and any questions for reviewers."
              rows={4}
            />
            <small>
              Do not describe an invalid sign or mark an unreviewed video as
              approved.
            </small>
          </div>

          <div className="psl-form-required-note">
            * Required fields
          </div>

          <div className="psl-form-actions">
            <button
              type="button"
              className="psl-form-cancel"
              onClick={() => navigate("/admin/psl-dictionary")}
            >
              Cancel
            </button>

            <button type="submit" className="psl-form-save">
              {isEdit ? "Save changes" : "Save draft"}
            </button>
          </div>
        </form>

        <aside className="psl-form-sidebar">
          <div className="psl-guidance-card psl-validation-card">
            <div className="psl-guidance-icon">ⓘ</div>
            <div>
              <h3>
                {isEdit
                  ? "Awaiting expert/community validation"
                  : "Validation required"}
              </h3>
              <p>
                {isEdit
                  ? "This draft is not approved PSL content. It requires review and validation before publication."
                  : "A draft entry must undergo review before it becomes searchable in the approved PSL dictionary."}
              </p>
            </div>
          </div>

          {isEdit ? (
            <div className="psl-review-card">
              <h3>Review status</h3>
              <span className="psl-review-badge">● Not reviewed</span>

              <div className="psl-review-item">
                <span>Expert review:</span>
                <strong>Not completed</strong>
              </div>

              <div className="psl-review-item">
                <span>Community review:</span>
                <strong>Not completed</strong>
              </div>

              <div className="psl-review-divider" />

              <p>
                Last edited: {sign?.date || "Not available"}. Saving updates
                this draft; it does not publish or validate the sign.
              </p>
            </div>
          ) : (
            <div className="psl-guidance-card psl-reference-card">
              <h3>A responsible reference</h3>
              <ul>
                <li>Provide an English gloss, not a claim of a universal sign.</li>
                <li>Note regional variation and the source of your reference.</li>
                <li>Confirm permission to use the recording.</li>
                <li>Keep the entry in Draft until the review is complete.</li>
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default PSLSignForm;
