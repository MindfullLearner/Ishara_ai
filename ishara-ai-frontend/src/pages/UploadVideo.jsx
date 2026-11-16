import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../api/auth";
import "./UploadVideo.css";

const MAX_FILE_SIZE = 250 * 1024 * 1024;
const VIDEO_FORMATS = {
  mp4: { mime: "video/mp4", label: "MP4" },
  webm: { mime: "video/webm", label: "WebM" },
  avi: { mime: "video/x-msvideo", label: "AVI" },
};

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "Duration unavailable";
  const total = Math.floor(seconds);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function getSupportedFormat(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const format = VIDEO_FORMATS[extension];
  if (!format) return { error: "This file type isn’t supported. Choose an MP4, WebM, or AVI video." };
  if (file.size === 0) return { error: "This file is empty. Choose a different video." };
  if (file.size > MAX_FILE_SIZE) return { error: "This video is too large. Choose a file smaller than 250 MB." };

  const previewer = document.createElement("video");
  if (!previewer.canPlayType(format.mime)) {
    return { error: `${format.label} preview is not supported by this browser. Choose an MP4 or WebM file this browser can play.` };
  }

  return { format };
}

function Icon({ name }) {
  const paths = {
    upload: <><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 14v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /></>,
    video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></>,
    file: <><path d="M7 3.75h7l4 4V20a1.25 1.25 0 0 1-1.25 1.25h-9.5A1.25 1.25 0 0 1 6 20V5a1.25 1.25 0 0 1 1-1.25Z" /><path d="M14 4v4h4M9 13h6m-6 3h4" /></>,
    face: <><path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3" /><circle cx="9" cy="10" r=".7" /><circle cx="15" cy="10" r=".7" /><path d="M9 14c1.8 1.5 4.2 1.5 6 0" /></>,
    light: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    error: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5m0 3h.01" /></>,
    play: <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4z" /></>,
  };
  return <svg className="ish-upload-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

function Header({ user, onLogout }) {
  const name = user?.full_name?.trim() || "there";
  const initials = name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return (
    <header className="ish-upload-header">
      <Link className="ish-upload-brand" to="/dashboard">ishara.ai</Link>
      <nav className="ish-upload-nav" aria-label="User dashboard navigation">
        <Link className="ish-upload-nav-item is-active" to="/dashboard">Dashboard</Link>
        <Link className="ish-upload-nav-item" to="/dashboard/translation-history">Translation History</Link>
        <Link className="ish-upload-nav-item" to="/dashboard/profile-settings">Profile / Settings</Link>
      </nav>
      <div className="ish-upload-account">
        <span className="ish-upload-avatar" aria-hidden="true">{initials || "I"}</span>
        <span className="ish-upload-account-name">{name}</span>
        <button type="button" className="ish-upload-signout" onClick={onLogout}>Sign out</button>
      </div>
    </header>
  );
}

function Tip({ icon, title, children }) {
  return <li className="ish-upload-tip"><Icon name={icon} /><div><strong>{title}</strong><span>{children}</span></div></li>;
}

function UploadVideo({ user }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const objectUrlRef = useRef("");
  const currentUrlRef = useRef("");
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState(null);
  const [previewState, setPreviewState] = useState("idle");
  const [fileError, setFileError] = useState("");
  const [fileErrorName, setFileErrorName] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [submissionNotice, setSubmissionNotice] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  function releaseSelection() {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = "";
    currentUrlRef.current = "";
    setVideoUrl("");
    setFile(null);
    setDuration(null);
    setPreviewState("idle");
    setPreviewError("");
    setSubmissionNotice("");
  }

  function chooseFile(nextFile) {
    if (!nextFile) return;
    releaseSelection();
    setFileError("");
    setFileErrorName("");

    const result = getSupportedFormat(nextFile);
    if (result.error) {
      setFileError(result.error);
      setFileErrorName(nextFile.name);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const url = URL.createObjectURL(nextFile);
    objectUrlRef.current = url;
    currentUrlRef.current = url;
    setFile(nextFile);
    setVideoUrl(url);
    setPreviewState("loading");
    setSubmissionNotice("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleInput(event) {
    chooseFile(event.target.files?.[0]);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false);
  }

  function handlePreviewError(url) {
    if (currentUrlRef.current !== url) return;
    setDuration(null);
    setPreviewState("error");
    setPreviewError("This video could not be previewed. It may be damaged or encoded with an unsupported codec. Choose another file.");
  }

  function removeVideo() {
    releaseSelection();
    setFileError("");
    setFileErrorName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSubmit() {
    if (!file || previewState !== "ready" || previewError) return;
    setSubmissionNotice("Upload and translation services are not connected yet. Your video has not been uploaded or submitted for translation.");
  }

  function handleLogout() {
    releaseSelection();
    logoutUser();
    navigate("/login", { replace: true });
  }

  const invalid = Boolean(fileError || previewError || previewState === "error");
  const hasSelection = Boolean(file && videoUrl);
  const hasValidPreview = Boolean(file && videoUrl && previewState === "ready" && !previewError);

  return (
    <main className="ish-upload-page">
      <div className="ish-upload-shell">
        <Header user={user} onLogout={handleLogout} />
        <div className="ish-upload-heading">
          <div><h1>Upload Video</h1><p>Choose a recorded PSL video for translation.</p></div>
          <Link className="ish-upload-back" to="/dashboard">Back to Dashboard</Link>
        </div>
        <input
          ref={inputRef}
          id="ish-upload-file"
          className="ish-upload-file-input"
          type="file"
          accept=".mp4,.webm,.avi,video/mp4,video/webm,video/x-msvideo"
          onChange={handleInput}
        />

        <div className="ish-upload-layout">
          <section className={`ish-upload-main-card ${invalid ? "has-error" : ""}`} aria-label="Video selection and preview">
            <div className="ish-upload-card-heading">
              <strong><Icon name="video" />{hasValidPreview ? "Review your video" : fileError ? "Choose a supported video" : hasSelection && previewState === "loading" ? "Checking your video" : "Choose your video"}</strong>
              <span className={`ish-upload-status ${invalid ? "is-error" : hasValidPreview ? "is-ready" : ""}`}>
                <i />{invalid ? "Invalid file" : hasValidPreview ? "Video selected" : hasSelection && previewState === "loading" ? "Checking preview" : "No video selected"}
              </span>
            </div>

            {!hasSelection ? (
              <label
                className={`ish-upload-dropzone ${isDragging ? "is-dragging" : ""} ${invalid ? "is-error" : ""}`}
                htmlFor="ish-upload-file"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <span className="ish-upload-drop-icon"><Icon name={invalid ? "error" : "upload"} /></span>
                <strong>{invalid ? "This video can’t be previewed" : "Drag and drop your video here"}</strong>
                <span>{invalid ? "Choose a different video file to continue." : "Or choose a recorded PSL video from your device."}</span>
                <span className="ish-upload-browse">{invalid ? "Choose Another Video" : "Browse Files"}</span>
                <span className="ish-upload-formats">Supported formats: MP4, WebM, AVI · Maximum size: 250 MB</span>
              </label>
            ) : (
              <div className="ish-upload-preview-wrap">
                <div className="ish-upload-video-frame">
                  <span className="ish-upload-video-label">VIDEO PREVIEW</span>
                  <video
                    ref={videoRef}
                    className="ish-upload-video"
                    src={videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    aria-label={`Preview of ${file.name}`}
                    onLoadedMetadata={(event) => {
                      if (currentUrlRef.current !== videoUrl) return;
                      const video = event.currentTarget;
                      if (video.videoWidth <= 0 || video.videoHeight <= 0) {
                        handlePreviewError(videoUrl);
                        return;
                      }
                      setDuration(Number.isFinite(video.duration) && video.duration >= 0 ? video.duration : null);
                      setPreviewError("");
                      setPreviewState("ready");
                    }}
                    onError={() => handlePreviewError(videoUrl)}
                  />
                </div>
                {previewState === "loading" && <div className="ish-upload-alert is-info" role="status"><Icon name="info" /><div><strong>Checking video preview</strong><span>Wait for the browser to load the video metadata before submitting.</span></div></div>}
                <div className="ish-upload-file-details">
                  <span className="ish-upload-file-icon"><Icon name="file" /></span>
                  <div><strong title={file.name}>{file.name}</strong><span>{formatFileSize(file.size)}{duration === null ? ` · ${previewState === "loading" ? "Reading duration…" : "Duration unavailable"}` : ` · ${formatDuration(duration)}`}</span></div>
                </div>
                {previewError && <div className="ish-upload-alert is-error" role="alert"><Icon name="error" /><div><strong>Video preview failed</strong><span>{previewError}</span></div></div>}
                {submissionNotice && <div className="ish-upload-alert is-info" role="status"><Icon name="info" /><div><strong>Upload is not available yet</strong><span>{submissionNotice}</span></div></div>}
                <div className="ish-upload-selection-actions">
                  <div>
                    <button className="ish-upload-button is-secondary" type="button" onClick={() => inputRef.current?.click()}>Replace Video</button>
                    <button className="ish-upload-button is-secondary" type="button" onClick={removeVideo}>Remove Video</button>
                  </div>
                  <button className="ish-upload-button is-primary" type="button" onClick={handleSubmit} disabled={!hasValidPreview}>Submit for Translation</button>
                </div>
              </div>
            )}

            {!hasSelection && (
              <>
                {(fileError || previewError) && <div className="ish-upload-alert is-error" role="alert"><Icon name="error" /><div><strong>{previewError ? "Video preview failed" : "This file can’t be used"}</strong><span>{previewError || fileError}{fileErrorName ? ` (${fileErrorName})` : ""}</span></div></div>}
                {submissionNotice && <div className="ish-upload-alert is-info" role="status"><Icon name="info" /><div><strong>Upload is not available yet</strong><span>{submissionNotice}</span></div></div>}
                <div className="ish-upload-empty-footer"><span>{invalid ? "Choose a supported video to continue." : "Choose a video to continue."}</span><button className="ish-upload-button is-primary" type="button" onClick={handleSubmit} disabled>Submit for Translation</button></div>
              </>
            )}
          </section>

          <aside className="ish-upload-aside">
            <section className="ish-upload-tips-card">
              <h2><Icon name="video" />Before you upload</h2>
              <ul>
                <Tip icon="file" title="Choose a video file">MP4, WebM, or browser-playable AVI.</Tip>
                <Tip icon="face" title="Keep signing clearly visible">Your face, hands and upper body should stay in view.</Tip>
                <Tip icon="light" title="Check the recording">Use a clear, well-lit video with one complete thought.</Tip>
              </ul>
            </section>
            <section className="ish-upload-side-note">
              <h2><Icon name="play" />You’re in control</h2>
              <p>Review your video before submitting it. You can replace or remove it if you picked the wrong file.</p>
              <span>MP4 · WEBM · AVI</span>
            </section>
          </aside>
        </div>

        <nav className="ish-upload-steps" aria-label="Video workflow">
          <span className={!hasValidPreview ? "is-current" : ""}><i><Icon name="upload" /></i>Choose your video</span>
          <span className={hasValidPreview ? "is-current" : ""}><i><Icon name="play" /></i>Review your video</span>
          <span><i><Icon name="file" /></i>Submit for translation</span>
        </nav>
        <p className="ish-upload-footnote"><Icon name="info" />Uploading a video does not start translation. Submission will be available when backend integration is ready.</p>
      </div>
    </main>
  );
}

export default UploadVideo;
