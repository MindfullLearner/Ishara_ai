import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../api/auth";
import "./LiveCamera.css";

const INITIAL_MESSAGE = "Allow camera access to preview and record your signing. Recording will not start automatically.";

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

function getCameraError(error) {
  if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
    return "Camera access was denied. Allow camera permission in your browser settings, then try again.";
  }
  if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
    return "No camera was found. Connect a camera and try again.";
  }
  if (error?.name === "NotReadableError" || error?.name === "TrackStartError") {
    return "Your camera could not be started. It may be in use by another app.";
  }
  if (error?.name === "OverconstrainedError") {
    return "The available camera does not meet the browser's video requirements.";
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return "Camera access is not supported in this browser or page context. Open the site in a supported browser over HTTPS or localhost.";
  }
  return "The camera could not be started. Check your browser permissions and try again.";
}

function Icon({ name }) {
  const paths = {
    camera: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></>,
    permission: <><path d="M12 3 3.5 7v5c0 5 3.5 8 8.5 9 5-1 8.5-4 8.5-9V7L12 3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    face: <><path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3" /><circle cx="9" cy="10" r=".7" /><circle cx="15" cy="10" r=".7" /><path d="M9 14c1.8 1.5 4.2 1.5 6 0" /></>,
    hands: <><path d="M7 12V6.5a1.3 1.3 0 0 1 2.6 0V10 5.5a1.3 1.3 0 0 1 2.6 0V10 6.2a1.3 1.3 0 0 1 2.6 0V11l.8-1a1.4 1.4 0 0 1 2.4 1.2l-.8 4.3c-.5 2.8-2.2 4.5-5 4.5h-1.3c-1.7 0-2.8-.7-3.8-2L5 15.2a1.5 1.5 0 0 1 2-2.2Z" /></>,
    light: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    play: <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4z" /></>,
    clip: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2M8 9h8m-8 4h8m-8 4h5" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
  };
  return <svg className="ish-live-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

function Header({ user, onLogout }) {
  const name = user?.full_name?.trim() || "there";
  const initials = name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return (
    <header className="ish-live-header">
      <Link className="ish-live-brand" to="/dashboard">ishara.ai</Link>
      <nav className="ish-live-nav" aria-label="User dashboard navigation">
        <Link className="ish-live-nav-item is-active" to="/dashboard">Dashboard</Link>
        <Link className="ish-live-nav-item" to="/dashboard/translation-history">Translation History</Link>
        <Link className="ish-live-nav-item" to="/dashboard/profile-settings">Profile / Settings</Link>
      </nav>
      <div className="ish-live-account">
        <span className="ish-live-avatar" aria-hidden="true">{initials || "I"}</span>
        <span className="ish-live-account-name">{name}</span>
        <button type="button" className="ish-live-signout" onClick={onLogout}>Sign out</button>
      </div>
    </header>
  );
}

function Tip({ icon, title, children }) {
  return <li className="ish-live-tip"><Icon name={icon} /><div><strong>{title}</strong><span>{children}</span></div></li>;
}

function LiveCamera({ user }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingUrlRef = useRef("");
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);
  const mountedRef = useRef(true);
  const [phase, setPhase] = useState("permission");
  const [cameraError, setCameraError] = useState("");
  const [recordingError, setRecordingError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [clipDuration, setClipDuration] = useState(null);
  const [clipDurationLoading, setClipDurationLoading] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [requestingCamera, setRequestingCamera] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      window.clearInterval(timerRef.current);
      if (recorderRef.current?.state === "recording") {
        try { recorderRef.current.stop(); } catch { /* Browser may already be stopping it. */ }
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === "ready" || phase === "recording") {
      if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [phase]);

  async function requestCamera() {
    if (streamRef.current || requestingCamera) return;
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(getCameraError());
      return;
    }
    setRequestingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          if (!mountedRef.current) return;
          streamRef.current = null;
          setCameraError("The camera connection ended. Reconnect or re-enable your camera to continue.");
          setPhase("permission");
        }, { once: true });
      });
      setPhase("ready");
    } catch (error) {
      if (mountedRef.current) setCameraError(getCameraError(error));
    } finally {
      if (mountedRef.current) setRequestingCamera(false);
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream || !window.MediaRecorder) {
      setRecordingError("Video recording is not supported in this browser.");
      return;
    }
    if (recorderRef.current?.state === "recording") return;

    setRecordingError("");
    chunksRef.current = [];
    setElapsed(0);
    setClipDuration(null);
    setClipDurationLoading(false);
    let recorder;
    try {
      const preferredType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
        .find((type) => MediaRecorder.isTypeSupported?.(type));
      recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
    } catch {
      setRecordingError("This browser could not prepare a video recording. Please try another supported browser.");
      return;
    }

    recorderRef.current = recorder;
    let recordingFailed = false;
    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunksRef.current.push(event.data);
    };
    recorder.onerror = () => {
      recordingFailed = true;
      window.clearInterval(timerRef.current);
      if (mountedRef.current) {
        setRecordingError("A recording error occurred. Please try recording again.");
      }
      if (recorder.state === "recording") {
        try { recorder.stop(); } catch { /* Recorder may have already stopped. */ }
      }
    };
    recorder.onstop = () => {
      window.clearInterval(timerRef.current);
      if (!mountedRef.current) {
        chunksRef.current = [];
        return;
      }
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      chunksRef.current = [];
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      if (recordingFailed) {
        setClipDurationLoading(false);
        setPhase("ready");
        return;
      }
      if (!blob.size) {
        setRecordingError("No video data was captured. Please try recording again.");
        setClipDurationLoading(false);
        setPhase("ready");
        return;
      }
      const nextUrl = URL.createObjectURL(blob);
      if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
      recordingUrlRef.current = nextUrl;
      setRecordingUrl(nextUrl);
      setClipDuration(null);
      setClipDurationLoading(true);
      setPhase("review");
    };

    try {
      recorder.start(250);
      startedAtRef.current = Date.now();
      setPhase("recording");
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);
    } catch {
      recorderRef.current = null;
      setRecordingError("Recording could not be started. Check your camera and try again.");
    }
  }

  function stopRecording() {
    window.clearInterval(timerRef.current);
    setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
  }

  function recordAgain() {
    chunksRef.current = [];
    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
    recordingUrlRef.current = "";
    setRecordingUrl("");
    setClipDuration(null);
    setClipDurationLoading(false);
    setElapsed(0);
    setRecordingError("");
    setPhase("ready");
  }

  function handleLogout() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    logoutUser();
    navigate("/login", { replace: true });
  }

  const reviewing = phase === "review";
  const status = phase === "permission" ? "Permission required" : phase === "recording" ? "Recording" : reviewing ? "Recording stopped" : "Camera ready";

  return (
    <main className="ish-live-page">
      <div className="ish-live-shell">
        <Header user={user} onLogout={handleLogout} />
        <div className="ish-live-heading">
          <div><h1>Live Camera</h1><p>Record your signing to translate it into text.</p></div>
          <Link className="ish-live-back" to="/dashboard">Back to Dashboard</Link>
        </div>

        <div className="ish-live-layout">
          <section className="ish-live-main-card" aria-label={reviewing ? "Recorded video review" : "Camera preview"}>
            <div className="ish-live-card-heading">
              <strong><Icon name={reviewing ? "clip" : "camera"} />{reviewing ? "Recorded clip" : "Camera preview"}</strong>
              <span className={`ish-live-status is-${phase}`}><i />{status}</span>
            </div>

            <div className={`ish-live-preview ${reviewing ? "is-review" : ""}`}>
              {reviewing && recordingUrl ? (
                <video
                  className="ish-live-video ish-live-recorded"
                  src={recordingUrl}
                  controls
                  playsInline
                  aria-label="Recorded signing video"
                  onLoadedMetadata={(event) => {
                    const mediaDuration = event.currentTarget.duration;
                    setClipDuration(Number.isFinite(mediaDuration) && mediaDuration >= 0 ? mediaDuration : null);
                    setClipDurationLoading(false);
                  }}
                  onDurationChange={(event) => {
                    const mediaDuration = event.currentTarget.duration;
                    if (Number.isFinite(mediaDuration) && mediaDuration >= 0) {
                      setClipDuration(mediaDuration);
                      setClipDurationLoading(false);
                    }
                  }}
                  onError={() => setClipDurationLoading(false)}
                />
              ) : (
                <>
                  <video ref={videoRef} className={`ish-live-video ${phase === "permission" ? "is-hidden" : ""}`} autoPlay muted playsInline aria-label="Live webcam preview" />
                  <div className="ish-live-camera-label"><Icon name={reviewing ? "clip" : "camera"} />{phase === "recording" ? "RECORDING YOUR CLIP" : "CAMERA PREVIEW"}</div>
                  <div className="ish-live-preview-message">
                    <span className="ish-live-preview-symbol"><Icon name={phase === "permission" ? "permission" : "camera"} /></span>
                    <strong>{phase === "permission" ? "Your camera is not on yet" : phase === "recording" ? "Recording your clip" : "Camera ready"}</strong>
                    <span>{phase === "permission" ? "Allow camera access to see your preview here." : phase === "recording" ? "Sign naturally. Select Stop when you have finished." : "Position yourself comfortably, then select Record."}</span>
                  </div>
                  <p className="ish-live-preview-disclaimer">No camera footage or sample signing is shown.</p>
                </>
              )}
            </div>

            {phase === "permission" ? (
              <div className="ish-live-control-row ish-live-permission-row">
                <div><strong>Let’s set up your camera</strong><span>{INITIAL_MESSAGE}</span></div>
                <button className="ish-live-button is-primary" type="button" onClick={requestCamera} disabled={requestingCamera}>{requestingCamera ? "Requesting…" : "Allow Camera"}</button>
              </div>
            ) : reviewing ? (
              <div className="ish-live-control-row">
                <div className="ish-live-duration"><span>Complete clip</span><strong><Icon name="info" />{clipDurationLoading ? "Reading duration…" : clipDuration === null ? "Duration unavailable" : formatTime(clipDuration)}</strong></div>
                <div className="ish-live-button-group">
                  <button className="ish-live-button is-secondary" type="button" onClick={recordAgain}>Record Again</button>
                  <button className="ish-live-button is-primary" type="button" onClick={() => setRecordingError("Translation backend integration is not available yet. Your recording has not been submitted.")}>Submit for Translation</button>
                </div>
              </div>
            ) : (
              <div className="ish-live-control-row">
                <div className="ish-live-duration"><span>Recording time</span><strong><Icon name="info" />{formatTime(elapsed)}</strong></div>
                <div className="ish-live-button-group">
                  <button className="ish-live-button is-primary" type="button" onClick={startRecording} disabled={phase === "recording"}>Record</button>
                  <button className="ish-live-button is-stop" type="button" onClick={stopRecording} disabled={phase !== "recording"}>Stop</button>
                </div>
              </div>
            )}
            {(cameraError || recordingError) && <div className="ish-live-error" role="alert">{cameraError || recordingError}</div>}
          </section>

          <aside className="ish-live-aside">
            {phase === "permission" && cameraError ? (
              <section className="ish-live-notice is-warning"><Icon name="permission" /><div><strong>Camera unavailable</strong><span>{cameraError}</span></div></section>
            ) : null}
            <section className="ish-live-tips-card">
              <h2><Icon name={reviewing ? "check" : "face"} />{reviewing ? "Check your clip" : "For a clear recording"}</h2>
              <ul>
                <Tip icon="face" title="Face and upper body visible">Sit back so your expressions stay in frame.</Tip>
                <Tip icon="hands" title="Keep both hands in view">Leave room around you for natural movement.</Tip>
                <Tip icon="light" title="Use good, even lighting">Face a light source and keep the camera steady.</Tip>
              </ul>
            </section>
            <section className="ish-live-side-note">
              <h2><Icon name={reviewing ? "play" : phase === "permission" ? "permission" : "camera"} />{reviewing ? "Happy with your recording?" : phase === "recording" ? "Take your time" : phase === "permission" ? "Camera permission required" : "Ready when you are"}</h2>
              <p>{reviewing ? "Play the clip to check it captured your complete thought. Select Record Again to replace it, or keep it for later." : phase === "recording" ? "Finish your signing, then select Stop. You’ll be able to play your complete recording or record again before submitting." : phase === "permission" ? INITIAL_MESSAGE : "Select Record to begin. Stop becomes available once recording starts. Capture one complete thought, then review your clip."}</p>
            </section>
          </aside>
        </div>

        <nav className="ish-live-steps" aria-label="Recording workflow">
          <span className={phase !== "review" ? "is-current" : ""}><i><Icon name="camera" /></i>Record your clip</span>
          <span className={phase === "review" ? "is-current" : ""}><i><Icon name="play" /></i>Review your recording</span>
          <span><i><Icon name="clip" /></i>Submit for translation</span>
        </nav>
        <p className="ish-live-footnote"><Icon name="info" />Translation starts only after you finish, review and submit your clip.</p>
      </div>
    </main>
  );
}

export default LiveCamera;
