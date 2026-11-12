import "./AdminDemoNotice.css";

export default function AdminDemoNotice({ children }) {
  return (
    <aside className="admin-demo-notice" role="note">
      <strong>Demo data</strong>
      <span>{children}</span>
    </aside>
  );
}
