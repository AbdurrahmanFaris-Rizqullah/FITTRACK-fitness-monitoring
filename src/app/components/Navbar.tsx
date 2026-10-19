"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard",    label: "Dashboard" },
  { href: "/body-metrics", label: "Body Fat"  },
  { href: "/users",        label: "Users"     },
];

/* ── Hamburger icon ─────────────────────────────────────────── */
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      {open ? (
        <>
          <line x1="4" y1="4"  x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="4" x2="4"  y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <line x1="3" y1="5"  x2="17" y2="5"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export default function Navbar() {
  const pathname         = usePathname();
  const [open, setOpen]  = useState(false);
  const drawerRef        = useRef<HTMLDivElement>(null);
  const hamburgerRef     = useRef<HTMLButtonElement>(null);
  /*
   * Track whether we're on the client so we never render the drawer in
   * a server-rendered state that could cause a hydration mismatch.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  /* ── Close on route change ──────────────────────────────── */
  useEffect(() => { setOpen(false); }, [pathname]);

  /* ── Lock body scroll while drawer is open (NOT overflow:hidden on body)
   * We add a CSS class to <html> instead of mutating body.style directly,
   * so we don't fight with other code and avoid iOS fixed-position bugs.
   */
  useEffect(() => {
    if (!mounted) return;
    if (open) {
      document.documentElement.classList.add("nav-open");
    } else {
      document.documentElement.classList.remove("nav-open");
    }
    return () => {
      document.documentElement.classList.remove("nav-open");
    };
  }, [open, mounted]);

  /* ── Escape key ────────────────────────────────────────── */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      setOpen(false);
      hamburgerRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, mounted]);

  /* ── Move focus into drawer when it opens ─────────────── */
  useEffect(() => {
    if (!mounted || !open) return;
    const first = drawerRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
  }, [open, mounted]);

  /*
   * Use a regular click handler — onPointerDown fires before the browser
   * scroll-gesture recogniser on iOS which can swallow pointer events on
   * fast taps if we use onPointerDown without also calling
   * e.preventDefault(). A plain onClick after touch-action:manipulation
   * is the safest cross-device approach.
   */
  const toggle = () => setOpen((v) => !v);
  const close  = () => setOpen(false);

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid var(--border)",
          background: "rgba(12,12,14,0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <nav
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "0 16px",
            height: "var(--navbar-h, 58px)",
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
              fontSize: "1.25rem",
              letterSpacing: "0.1em",
              color: "var(--txt)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              marginRight: 8,
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

          {/* Desktop nav links — hidden on mobile via .nav-links-desktop CSS class */}
          <div
            className="nav-links-desktop"
            style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}
          >
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
                    whiteSpace: "nowrap",
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

          {/* Flex spacer — only on desktop (hidden on mobile with the links) */}
          <div className="nav-links-desktop" style={{ flex: 1 }} aria-hidden="true" />

          {/* Desktop CTA — hidden on mobile */}
          <Link
            href="/body-metrics"
            className="btn btn-primary nav-cta-desktop"
            style={{ fontSize: 12.5, padding: "7px 16px", flexShrink: 0, whiteSpace: "nowrap" }}
          >
            + Log Metrics
          </Link>

          {/*
           * Hamburger — only visible on mobile (≤767px) via CSS.
           *
           * Placed LAST in flex order so it sits at the right edge on mobile
           * (wordmark is flex-start, this is pushed by the margin-left: auto below).
           *
           * z-index: 52 ensures it renders above the sticky header (50) and
           * the drawer (51) so it's always tappable even if the drawer is open.
           */}
          <button
            ref={hamburgerRef}
            type="button"
            className="nav-hamburger"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            onClick={toggle}
            style={{ marginLeft: "auto" }}
          >
            <HamburgerIcon open={open} />
          </button>
        </nav>
      </header>

      {/*
       * Overlay — rendered outside <header> so it covers the full page.
       * Uses visibility + opacity transition (NOT display:none/block) so
       * the CSS transition plays correctly on iOS Safari.
       * pointer-events:none when hidden prevents tap-through.
       */}
      <div
        className="nav-drawer-overlay"
        data-open={mounted ? String(open) : "false"}
        aria-hidden="true"
        onClick={close}
      />

      {/*
       * Drawer — slides down from under the sticky header.
       * z-index: 51 puts it above the header (50) on screen but it starts
       * at top: var(--navbar-h) so it visually emerges from below the header.
       *
       * role="dialog" + aria-modal="true" tells screen readers this is a
       * modal panel; aria-label provides the accessible name.
       */}
      <div
        id="mobile-nav-drawer"
        ref={drawerRef}
        className="nav-drawer"
        data-open={mounted ? String(open) : "false"}
        role="dialog"
        aria-modal="true"
        aria-label="Navigasi utama"
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
              onClick={close}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: active ? "var(--accent)" : "var(--border-2)",
                }}
              />
              {label}
            </Link>
          );
        })}

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", margin: "8px 20px" }} />

        {/* CTA */}
        <div style={{ padding: "8px 20px 4px" }}>
          <Link
            href="/body-metrics"
            className="btn btn-primary"
            style={{ width: "100%", fontSize: 14, padding: "13px 20px" }}
            onClick={close}
          >
            + Log Metrics
          </Link>
        </div>
      </div>
    </>
  );
}
