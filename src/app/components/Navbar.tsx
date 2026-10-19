"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard",    label: "Dashboard" },
  { href: "/body-metrics", label: "Body Fat"  },
  { href: "/users",        label: "Users"     },
];

/* ── Hamburger icon (pure SVG, no deps) ────────────────────── */
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      style={{ transition: "transform 0.2s", display: "block" }}
    >
      {open ? (
        /* × close icon */
        <>
          <line x1="2" y1="2"  x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="2" x2="2"  y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        /* ≡ menu icon */
        <>
          <line x1="2" y1="4"  x2="16" y2="4"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="2" y1="9"  x2="16" y2="9"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="2" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export default function Navbar() {
  const pathname              = usePathname();
  const [open, setOpen]       = useState(false);
  const drawerRef             = useRef<HTMLDivElement>(null);
  const hamburgerRef          = useRef<HTMLButtonElement>(null);

  /* ── Close on route change ────────────────────────────────── */
  useEffect(() => { setOpen(false); }, [pathname]);

  /* ── Lock body scroll while drawer is open ───────────────── */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* ── Close on Escape key ─────────────────────────────────── */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      setOpen(false);
      hamburgerRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  /* ── Trap focus inside drawer when open ─────────────────────
   * Simple: when drawer opens, move focus to first link.        */
  useEffect(() => {
    if (open) {
      const first = drawerRef.current?.querySelector<HTMLElement>("a, button");
      first?.focus();
    }
  }, [open]);

  const toggle = () => setOpen((v) => !v);

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid var(--border)",
          background: "rgba(12,12,14,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <nav
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "0 24px",
            height: "var(--navbar-h, 58px)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* ── Wordmark ─────────────────────────────────────── */}
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
            <span
              aria-hidden="true"
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

          {/* ── Desktop links (hidden on mobile via CSS class) ── */}
          <div className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
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
                      (e.currentTarget as HTMLAnchorElement).style.color      = "var(--txt)";
                      (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.color      = "var(--txt-2)";
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    }
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Spacer on mobile so hamburger sits on the right */}
          <div style={{ flex: 1 }} className="nav-links-desktop" aria-hidden="true" />

          {/* ── Desktop CTA ──────────────────────────────────── */}
          <Link
            href="/body-metrics"
            className="btn btn-primary nav-cta-desktop"
            style={{ fontSize: 12.5, padding: "7px 16px", flexShrink: 0 }}
          >
            + Log Metrics
          </Link>

          {/* ── Hamburger button (mobile only, shown via CSS) ── */}
          <button
            ref={hamburgerRef}
            className="nav-hamburger"
            aria-label={open ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            onClick={toggle}
          >
            <HamburgerIcon open={open} />
          </button>
        </nav>
      </header>

      {/* ── Overlay (closes drawer on tap outside) ─────────── */}
      <div
        className="nav-drawer-overlay"
        data-open={String(open)}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      {/* ── Mobile drawer ────────────────────────────────────── */}
      <div
        id="mobile-nav-drawer"
        ref={drawerRef}
        className="nav-drawer"
        data-open={String(open)}
        role="dialog"
        aria-modal="true"
        aria-label="Navigasi"
      >
        {/* Nav links */}
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="nav-drawer-link"
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {/* active indicator dot */}
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: active ? "var(--accent)" : "var(--border-2)",
                  transition: "background 0.15s",
                }}
              />
              {label}
            </Link>
          );
        })}

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "var(--border)",
            margin: "8px 20px",
          }}
        />

        {/* CTA inside drawer */}
        <div style={{ padding: "8px 20px" }}>
          <Link
            href="/body-metrics"
            className="btn btn-primary"
            style={{ width: "100%", fontSize: 14, padding: "12px 20px" }}
            onClick={() => setOpen(false)}
          >
            + Log Metrics
          </Link>
        </div>
      </div>
    </>
  );
}
