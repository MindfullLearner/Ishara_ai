
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createPSLSign,
  updatePSLSign,
  uploadPSLSignMedia,
} from "../../../api/admin";
import "./PSLSignForm.css";

const API_BASE_URL = "http://127.0.0.1:8000";

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
  notes: "",
};

function PSLSignForm({ mode = "add", sign = null }) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [formData, setFormData] = useState(() =>
    isEdit && sign
      ? {
          label: sign.word || "",
          category: sign.category || "Everyday communication",
          notes: sign.description || "",
        }
      : EMPTY_FORM
  );

  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");

  // Create and clean up temporary image preview URLs
  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Create and clean up temporary video preview URLs
  useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validateFile = (file, type) => {
    if (!file) return "";

    const extension = file.name.split(".").pop().toLowerCase();

    if (type === "image") {
      if (!["jpg", "jpeg", "png", "webp"].includes(extension)) {
        return "Image must be JPG, JPEG, PNG, or WEBP.";
      }

      if (file.size > 5 * 1024 * 1024) {
        return "Image size must not exceed 5 MB.";
      }
    }

    if (type === "video") {
      if (!["mp4", "webm", "mov"].includes(extension)) {
        return "Video must be MP4, WEBM, or MOV.";
      }

      if (file.size > 50 * 1024 * 1024) {
        return "Video size must not exceed 50 MB.";
      }
    }

    return "";
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    const validationError = validateFile(file, "image");

    if (validationError) {
      setError(validationError);
      setImageFile(null);
      event.target.value = "";
      return;
    }

    setError("");
    setImageFile(file);
  };

  const handleVideoChange = (event) => {
    const file = event.target.files?.[0] || null;
    const validationError = validateFile(file, "video");

    if (validationError) {
      setError(validationError);
      setVideoFile(null);
      event.target.value = "";
      return;
    }

    setError("");
    setVideoFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.label.trim()) {
      setError("Please enter an English gloss.");
      return;
    }

    if (!formData.category.trim()) {
      setError("Please select a category.");
      return;
    }

    const payload = {
      word: formData.label.trim(),
      description: formData.notes.trim() || null,
      category: formData.category,
      video_url: isEdit ? sign?.video_url || null : null,
      image_url: isEdit ? sign?.image_url || null : null,
      status: "draft",
    };

    try {
      setIsSaving(true);
      setError("");

      let savedSign;

      if (isEdit) {
        savedSign = await updatePSLSign(sign.id, payload);
      } else {
        savedSign = await createPSLSign(payload);
      }

      if (imageFile) {
        savedSign = await uploadPSLSignMedia(
          savedSign.id,
          imageFile,
          "image"
        );
      }

      if (videoFile) {
        savedSign = await uploadPSLSignMedia(
          savedSign.id,
          videoFile,
          "video"
        );
      }

      navigate("/admin/psl-dictionary");
    } catch (err) {
      setError(
        err.message ||
          `Unable to ${isEdit ? "update" : "create"} PSL sign.`
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="psl-form-page">
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
              ● Draft - Not validated
            </span>
          </div>

          {isEdit && (
            <p className="psl-sign-reference">
              PSL-SIGN-{String(sign?.id || "").padStart(4, "0")} · Example draft
            </p>
          )}

          {error && (
            <p className="psl-form-error" role="alert">
              {error}
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
                maxLength={150}
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

          {/* IMAGE UPLOAD */}
          <div className="psl-form-field psl-media-field">
            <label>Reference image</label>

            {(imagePreviewUrl || (isEdit && sign?.image_url)) && (
              <div className="psl-image-preview">
                <img
                  src={
                    imagePreviewUrl ||
                    `${API_BASE_URL}${sign.image_url}`
                  }
                  alt={`${formData.label || "PSL sign"} reference`}
                />

                <span>
                  {imageFile ? "New image preview" : "Current reference image"}
                </span>
              </div>
            )}

            {imageFile ? (
              <div className="psl-selected-file">
                <span>🖼️ {imageFile.name}</span>
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  disabled={isSaving}
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="psl-upload-area" htmlFor="psl-image">
                <span className="psl-upload-icon">☁ ↑</span>
                <strong>Upload reference image</strong>
                <small>
                  Drag and drop your image here or choose a file
                </small>
                <span className="psl-choose-file">Choose image</span>

                <input
                  id="psl-image"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={isSaving}
                />
              </label>
            )}

            <small>JPG, JPEG, PNG, WEBP · Maximum 5 MB</small>
          </div>


          {/* VIDEO UPLOAD */}
          <div className="psl-form-field psl-media-field">
            <label>Reference video</label>

            {(videoPreviewUrl || (isEdit && sign?.video_url)) && (
              <div className="psl-video-preview">
                <video
                  src={
                    videoPreviewUrl ||
                    `${API_BASE_URL}${sign.video_url}`
                  }
                  controls
                  preload="metadata"
                />

                <span>
                  {videoFile ? "New video preview" : "Current reference video"}
                </span>
              </div>
            )}

            {videoFile ? (
              <div className="psl-selected-file">
                <span>🎬 {videoFile.name}</span>
                <button
                  type="button"
                  onClick={() => setVideoFile(null)}
                  disabled={isSaving}
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="psl-upload-area" htmlFor="psl-video">
                <span className="psl-upload-icon">☁ ↑</span>
                <strong>Upload reference video</strong>
                <small>
                  Drag and drop your video here or choose a file
                </small>
                <span className="psl-choose-file">Choose video</span>

                <input
                  id="psl-video"
                  type="file"
                  accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
                  onChange={handleVideoChange}
                  disabled={isSaving}
                />
              </label>
            )}

            <small>MP4, WEBM, MOV · Maximum 50 MB</small>
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
              disabled={isSaving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="psl-form-save"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Save draft"}
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
                  : "A draft entry must undergo review and validation before publication in the approved PSL dictionary."}
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
                Saving updates this draft; it does not publish or validate
                the sign.
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
