export default function AuthLayout({
  children,
  pageClassName = "",
  layoutClassName = "",
  mainClassName = "",
}) {
  return (
    <main className={`ish-auth-page ${pageClassName}`.trim()}>
      <section className={`ish-auth-layout ${layoutClassName}`.trim()}>
        <aside className="ish-auth-brand">
          <div className="ish-brand-logo">ishara.ai</div>
          <div className="ish-brand-message">
            <h1>Communication without barriers.</h1>
            <p>
              A more accessible way to connect through
              <br />
              Pakistan Sign Language.
            </p>
          </div>
          <div className="ish-brand-decoration" aria-hidden="true">
            <span />
          </div>
        </aside>

        <section className={`ish-auth-main ${mainClassName}`.trim()}>
          {children}
        </section>
      </section>
    </main>
  );
}
