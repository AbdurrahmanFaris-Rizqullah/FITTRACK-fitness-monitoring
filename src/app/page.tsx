import Link from "next/link";
import Navbar from "./components/Navbar";

const FEATURES = [
  {
    icon: "⚡",
    title: "US Navy Formula",
    desc: "Industry-standard body fat calculation from height, neck, waist & hip circumferences.",
  },
  {
    icon: "📈",
    title: "Progress Charts",
    desc: "Visualise weight, body fat %, and measurements over time with clean Recharts graphs.",
  },
  {
    icon: "🎯",
    title: "Category Ratings",
    desc: "Instantly see whether you're Athlete, Fit, Average, or need to keep grinding.",
  },
  {
    icon: "🗂️",
    title: "Multi-User",
    desc: "Manage separate profiles for every person you're tracking. No login friction.",
  },
];

const METRICS_ROWS = [
  { label: "Body Fat %",      value: "12.4%", badge: "Atlet", color: "var(--accent)" },
  { label: "Berat Badan",     value: "74.2 kg", badge: null, color: "var(--blue)"   },
  { label: "Lingkar Pinggang", value: "81 cm",  badge: null, color: "var(--txt-2)"  },
];

export default function HomePage() {
  return (
    <div
      className="noise-bg"
      style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}
    >
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────── */}
      {/*
       * .hero-section collapses to flex-col on ≤900 px (globals.css).
       * On ≤374 px the mock card is hidden entirely.
       */}
      <section className="hero-section">

        {/* Left copy */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="animate-fade-up" style={{ marginBottom: 24 }}>
            <span className="badge badge-lime">
              <span
                aria-hidden="true"
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  display: "inline-block",
                }}
              />
              US Navy Method
            </span>
          </div>

          <h1
            className="display animate-fade-up delay-1"
            style={{
              fontSize: "clamp(2.6rem, 7vw, 5.5rem)",
              marginBottom: 24,
              color: "var(--txt)",
            }}
          >
            Track your
            <br />
            <span style={{ color: "var(--accent)" }}>body</span> like
            <br />
            a machine.
          </h1>

          <p
            className="animate-fade-up delay-2"
            style={{
              fontSize: "clamp(14px, 2vw, 16px)",
              color: "var(--txt-2)",
              lineHeight: 1.7,
              maxWidth: 420,
              marginBottom: 40,
            }}
          >
            Log measurements, watch body fat drop, and get categorised
            against military fitness standards — all in one dashboard.
          </p>

          <div
            className="animate-fade-up delay-3"
            style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
          >
            <Link
              href="/dashboard"
              className="btn btn-primary"
              style={{ fontSize: 14, padding: "12px 28px" }}
            >
              Open Dashboard →
            </Link>
            <Link
              href="/users"
              className="btn btn-ghost"
              style={{ fontSize: 14, padding: "12px 28px" }}
            >
              Manage Users
            </Link>
          </div>
        </div>

        {/* Right mock card — hidden on ≤374 px via .hero-mock-card CSS */}
        <div
          className="animate-fade-up delay-2 hero-mock-card"
          style={{
            flexShrink: 0,
            width: 320,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {/* card header */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-2)",
              borderRadius: "var(--r-lg) var(--r-lg) 0 0",
              padding: "18px 20px 14px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                aria-hidden="true"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--accent-dim)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                💪
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)" }}>
                  Abdur
                </div>
                <div style={{ fontSize: 11, color: "var(--txt-3)" }}>
                  PRIA · 24 Oct 2004
                </div>
              </div>
              <span className="badge badge-lime" style={{ marginLeft: "auto" }}>
                Bugar
              </span>
            </div>
          </div>

          {/* metric rows */}
          {METRICS_ROWS.map((m) => (
            <div
              key={m.label}
              style={{
                background: "var(--surface)",
                borderLeft: "1px solid var(--border-2)",
                borderRight: "1px solid var(--border-2)",
                borderBottom: "1px solid var(--border)",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 12.5, color: "var(--txt-2)", flexShrink: 0 }}>
                {m.label}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 0,
                  flexShrink: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.4rem",
                    letterSpacing: "0.04em",
                    color: m.color,
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.value}
                </span>
                {m.badge && (
                  <span className="badge badge-lime">{m.badge}</span>
                )}
              </div>
            </div>
          ))}

          {/* sparkline footer */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-2)",
              borderTop: "none",
              borderRadius: "0 0 var(--r-lg) var(--r-lg)",
              padding: "16px 20px 20px",
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--txt-3)",
                marginBottom: 12,
              }}
            >
              Body Fat — 6 entries
            </div>
            <div
              style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 56 }}
              role="img"
              aria-label="Sparkline chart of body fat over 6 entries"
            >
              {[65, 72, 58, 80, 75, 45].map((h, i) => (
                <div key={i} style={{ flex: 1 }}>
                  <div
                    style={{
                      height: `${h}%`,
                      borderRadius: 4,
                      background:
                        i === 5 ? "var(--accent)" : "var(--surface-2)",
                      border:
                        i === 5 ? "none" : "1px solid var(--border-2)",
                      boxShadow:
                        i === 5 ? "0 0 12px var(--accent-glow)" : "none",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────── */}
      <section className="features-section">
        <div style={{ height: 1, background: "var(--border)", marginBottom: 48 }} />

        <p
          className="label animate-fade-up"
          style={{ marginBottom: 32, fontSize: 10.5, letterSpacing: "0.14em" }}
        >
          What you get
        </p>

        <div
          style={{
            display: "grid",
            /* auto-fill so cards wrap naturally at any width */
            gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))",
            gap: 16,
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`card animate-fade-up delay-${i + 1}`}
              style={{ padding: "24px 22px" }}
            >
              <div style={{ fontSize: 28, marginBottom: 14 }} aria-hidden="true">
                {f.icon}
              </div>
              <div
                style={{ fontSize: 14, fontWeight: 600, color: "var(--txt)", marginBottom: 8 }}
              >
                {f.title}
              </div>
              <div style={{ fontSize: 13, color: "var(--txt-2)", lineHeight: 1.6 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "20px 24px",
          paddingBottom:
            "max(20px, calc(20px + env(safe-area-inset-bottom)))",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "0.1em",
              fontSize: "0.95rem",
              color: "var(--txt-3)",
            }}
          >
            FITTRACK
          </span>
          <span style={{ fontSize: 12, color: "var(--txt-3)" }}>
            US Navy Body Fat Method · ACE Categories
          </span>
        </div>
      </footer>
    </div>
  );
}
