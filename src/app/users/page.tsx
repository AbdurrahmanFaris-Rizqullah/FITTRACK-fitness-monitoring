"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";

interface User {
  id_user:       string;
  username:      string;
  tanggal_lahir: string | null;
  kelamin:       "PRIA" | "WANITA" | null;
  created_at:    string;
}

function calcAge(dob: string | null): string {
  if (!dob) return "—";
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} th`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const KELAMIN_OPTS = [
  { value: "",       label: "Tidak diset" },
  { value: "PRIA",   label: "Pria"        },
  { value: "WANITA", label: "Wanita"      },
];

export default function UsersPage() {
  const [users,      setUsers]      = useState<User[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErr,    setFormErr]    = useState<string | null>(null);
  const [formData,   setFormData]   = useState({
    username: "", tanggal_lahir: "", kelamin: "",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Gagal memuat users");
      const json = await res.json();
      setUsers(json.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    if (!formData.username.trim()) { setFormErr("Username wajib diisi."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username:      formData.username.trim(),
          tanggal_lahir: formData.tanggal_lahir || null,
          kelamin:       formData.kelamin || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal membuat user");
      setFormData({ username: "", tanggal_lahir: "", kelamin: "" });
      setShowForm(false);
      fetchUsers();
    } catch (e: unknown) {
      setFormErr(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="noise-bg"
      style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}
    >
      <Navbar />

      <main className="main-pad">

        {/* ── Page header ──────────────────────────────────────── */}
        <div
          className="animate-fade-up"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <p className="label" style={{ marginBottom: 6 }}>Management</p>
            <h1
              className="display"
              style={{ fontSize: "clamp(2.4rem, 4vw, 3.5rem)", color: "var(--txt)" }}
            >
              Users
            </h1>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { setShowForm(!showForm); setFormErr(null); }}
            style={{ flexShrink: 0 }}
          >
            {showForm ? "✕ Tutup" : "+ Tambah User"}
          </button>
        </div>

        {/* ── Create form ──────────────────────────────────────── */}
        {showForm && (
          <div
            className="card animate-fade-up"
            style={{ marginBottom: 28, padding: "24px 24px 20px" }}
          >
            <h2
              style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)", marginBottom: 20 }}
            >
              Buat User Baru
            </h2>

            <form onSubmit={handleSubmit} noValidate>
              {/*
               * .form-grid-auto → repeat(auto-fill, minmax(200px,1fr))
               * On xs (< 480 px) it collapses to a single column.
               */}
              <div className="form-grid-auto" style={{ marginBottom: 20 }}>
                <div>
                  <label className="label" htmlFor="username">Username *</label>
                  <input
                    id="username"
                    className="input"
                    type="text"
                    placeholder="e.g. abdur_28"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, username: e.target.value }))
                    }
                    required
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="dob">Tanggal Lahir</label>
                  <input
                    id="dob"
                    className="input"
                    type="date"
                    value={formData.tanggal_lahir}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, tanggal_lahir: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="label" htmlFor="kelamin">Kelamin</label>
                  <select
                    id="kelamin"
                    className="input"
                    value={formData.kelamin}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, kelamin: e.target.value }))
                    }
                  >
                    {KELAMIN_OPTS.map((o) => (
                      <option key={o.value} value={o.value} style={{ background: "var(--bg-3)" }}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formErr && (
                <p
                  role="alert"
                  style={{ fontSize: 13, color: "var(--red)", marginBottom: 16 }}
                >
                  ⚠ {formErr}
                </p>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ flex: "1 0 auto" }}
                >
                  {submitting ? (
                    <><span className="spinner" aria-hidden="true" /> Menyimpan…</>
                  ) : (
                    "Simpan User"
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => { setShowForm(false); setFormErr(null); }}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────── */}
        {error && (
          <div
            className="animate-fade-in"
            role="alert"
            style={{
              background: "var(--red-dim)",
              border: "1px solid rgba(255,77,109,0.2)",
              borderRadius: "var(--r-md)",
              padding: "14px 18px",
              color: "var(--red)",
              fontSize: 13,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span style={{ flex: 1 }}>⚠ {error}</span>
            <button
              className="btn btn-ghost"
              style={{ padding: "4px 12px", fontSize: 12, flexShrink: 0 }}
              onClick={fetchUsers}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Loading ──────────────────────────────────────────── */}
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "60px 0",
              justifyContent: "center",
            }}
          >
            <span className="spinner" style={{ width: 24, height: 24, borderWidth: 2.5 }} aria-hidden="true" />
            <span style={{ color: "var(--txt-2)", fontSize: 14 }}>Memuat users…</span>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────── */}
        {!loading && !error && users.length === 0 && (
          <div
            className="card animate-fade-in"
            style={{ padding: "60px 24px", textAlign: "center" }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">👤</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)", marginBottom: 6 }}>
              Belum ada user
            </p>
            <p style={{ fontSize: 13, color: "var(--txt-2)", marginBottom: 24 }}>
              Tambah user pertama untuk mulai melacak body metrics.
            </p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + Tambah User
            </button>
          </div>
        )}

        {/* ── User list ─────────────────────────────────────────── */}
        {!loading && users.length > 0 && (
          <div className="animate-fade-up delay-1">
            <p style={{ fontSize: 12.5, color: "var(--txt-3)", marginBottom: 14 }}>
              {users.length} user{users.length !== 1 ? "s" : ""}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {users.map((u, i) => (
                <div
                  key={u.id_user}
                  className={`card animate-fade-up delay-${Math.min(i + 1, 5)}`}
                  style={{ padding: "18px 20px" }}
                >
                  {/*
                   * .user-card: flex wrap, gap.
                   * .user-card-body: avatar + name + badges (flex:1).
                   * .user-card-cta: on xs → width:100%, centered.
                   */}
                  <div className="user-card">
                    <div className="user-card-body">
                      {/* avatar */}
                      <div
                        aria-hidden="true"
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          background:
                            u.kelamin === "PRIA"
                              ? "var(--blue-dim)"
                              : "var(--accent-dim)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        {u.kelamin === "WANITA" ? "🧘‍♀️" : "💪"}
                      </div>

                      {/* name + id */}
                      <div style={{ flex: 1, minWidth: 100 }}>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "var(--txt)",
                            marginBottom: 2,
                          }}
                        >
                          {u.username}
                        </div>
                        <div
                          className="mono"
                          style={{ fontSize: 10.5, color: "var(--txt-3)" }}
                        >
                          {u.id_user.slice(0, 8)}…
                        </div>
                      </div>

                      {/* badges */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {u.kelamin && (
                          <span
                            className={`badge ${
                              u.kelamin === "PRIA" ? "badge-blue" : "badge-lime"
                            }`}
                          >
                            {u.kelamin}
                          </span>
                        )}
                        {u.tanggal_lahir && (
                          <span className="badge badge-muted">
                            {calcAge(u.tanggal_lahir)}
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: "var(--txt-3)" }}>
                          Dibuat {fmtDate(u.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* action — .user-card-cta goes full-width on xs */}
                    <Link
                      href={`/dashboard?user_id=${u.id_user}`}
                      className="btn btn-ghost user-card-cta"
                      style={{ fontSize: 12.5, padding: "7px 14px", flexShrink: 0 }}
                    >
                      Lihat Dashboard →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
