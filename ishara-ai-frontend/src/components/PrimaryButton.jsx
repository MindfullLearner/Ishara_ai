import { Link } from "react-router-dom";

export default function PrimaryButton({
  children,
  to,
  type = "button",
  disabled = false,
  loading = false,
  loadingLabel = "Please wait…",
  onClick,
  className = "",
  ...props
}) {
  const classes = `ish-button ish-button--primary ${className}`.trim();
  const content = loading ? loadingLabel : children;

  if (to) {
    return (
      <Link className={classes} to={to} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
}
