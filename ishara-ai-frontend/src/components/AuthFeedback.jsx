const VARIANT_ROLES = {
  error: "alert",
  success: "status",
  info: "status",
  loading: "status",
};

export default function AuthFeedback({
  variant = "info",
  title,
  children,
  className = "",
}) {
  const role = VARIANT_ROLES[variant] || "status";

  return (
    <div
      className={`ish-feedback ish-feedback--${variant} ${className}`.trim()}
      role={role}
      aria-live={variant === "error" ? "assertive" : "polite"}
    >
      {title && <strong className="ish-feedback-title">{title}</strong>}
      <div className="ish-feedback-content">{children}</div>
    </div>
  );
}
