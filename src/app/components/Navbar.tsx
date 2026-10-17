"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/users",     label: "Users" },
  { href: "/body-metrics", label: "Body Metrics" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--border)",
        background: "rgba(12,12,14,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <nav
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 24px",
          height: 58,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Wordmark */}
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.35rem",
            letterSpacing: "0.1em",
            color: "var(--txt)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginRight: 16,
            flexShrink: 0,
          }}
        >
          {/* accent dot */}
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "inline-block",
              boxShadow: "0 0 8px var(--accent-glow)",
              flexShrink: 0,
            }}
          />
          FIT-TRACKING
        </Link>

        {/* Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--r-md)",
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--accent)" : "var(--txt-2)",
                  background: active ? "var(--accent-dim)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s var(--ease)",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--txt)";
                    (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--txt-2)";
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  }
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <Link
          href="/body-metrics"
          className="btn btn-primary"
          style={{ fontSize: 12.5, padding: "7px 16px" }}
        >
          + Log Metrics
        </Link>
      </nav>
    </header>
  );
}
