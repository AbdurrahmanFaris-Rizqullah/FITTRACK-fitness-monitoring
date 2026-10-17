"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Navbar from "../components/Navbar";

/* ─── types ──────────────────────────────────────────────── */
interface User {
  id_user: string;
  username: string;
  kelamin: "PRIA" | "WANITA" | null;
}

interface BodyMetric {
  id_bm: string;
  user_id: string;
  tb: number | null;
  bb: number | null;
  lingkar_leher: number | null;
  lingkar_pinggang: number | null;
  lingkar_pinggul: number | null;
  body_fat: number | null;
  catatan: string | null;
  created_at: string;
}

/* ─── client-side US Navy preview ────────────────────────── */
function previewBodyFat(
  kelamin: "PRIA" | "WANITA" | null,
  tb: number,
  leher: number,
  pinggang: number,
  pinggul: number
): { value: number; valid: boolean; kategori: string } | null {
  if (!kelamin || !tb || !leher || !pinggang) return null;
  if (kelamin === "WANITA" && !pinggul) return null;

  let bf: number;
  if (kelamin === "PRIA") {
    const arg = pinggang - leher;
    if (arg <= 0) return null;
    bf = 495 / (1.0324 - 0.19077 * Math.log10(arg) + 0.15456 * Math.log10(tb)) - 450;
  } else {
    const arg = pinggang + pinggul - leher;
    if (arg <= 0) return null;
    bf = 495 / (1.29579 - 0.35004 * Math.log10(arg) + 0.221 * Math.log10(tb)) - 450;
  }

  if (!isFinite(bf) || bf < 0 || bf > 70) return null;

  const kategori = (k: "PRIA" | "WANITA", v: number) => {
    if (k === "PRIA") {
      if (v < 5)  return "Sangat Kurus";
      if (v < 13) return "Atlet";
      if (v < 17) return "Bugar";
      if (v < 24) return "Rata-rata";
      return "Gemoy";
    }
    if (v < 13) return "Sangat Kurus";
    if (v < 20) return "Atlet";
    if (v < 24) return "Bugar";
    if (v < 31) return "Rata-rata";
    return "Gemoy";
  };

  return { value: parseFloat(bf.toFixed(2)), valid: true, kategori: kategori(kelamin, bf) };
}

function kategoriColor(k: string) {
  switch (k) {
    case "Atlet":        return { bg: "var(--blue-dim)",   color: "var(--blue)" };
    case "Bugar":        return { bg: "var(--accent-dim)", color: "var(--accent)" };
    case "Rata-rata":    return { bg: "var(--amber-dim)",  color: "var(--amber)" };
    case "Gemoy":        return { bg: "var(--red-dim)",    color: "var(--red)" };
    case "Sangat Kurus": return { bg: "var(--red-dim)",    color: "var(--red)" };
    default:             return { bg: "var(--surface-2)",  color: "var(--txt-2)" };
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const EMPTY_FORM = {
  user_id: "",
  tb: "",
  bb: "",
  lingkar_leher: "",
  lingkar_pinggang: "",
  lingkar_pinggul: "",
  catatan: "",
};

/* ─── component ──────────────────────────────────────────── */
export default function BodyMetricsPage() {
  const [users, setUsers]             = useState<User[]>([]);
  const [records, setRecords]         = useState<BodyMetric[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRecs, setLoadingRecs]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [formErr, setFormErr]         = useState<string | null>(null);
  const [submitOk, setSubmitOk]       = useState<string | null>(null);
  const [form, setForm]               = useState(EMPTY_FORM);

  /**
   * tbPrefill — the most recently recorded height for the selected user.
   * Updated whenever records reload (user switches or new record saved).
   * Only shown when form.tb is empty (user hasn't typed anything yet).
   */
  const [tbPrefill, setTbPrefill] = useState<number | null>(null);

  /* selected user's gender for live preview */
  const selectedUser = useMemo(
    () => users.find((u) => u.id_user === form.user_id) ?? null,
    [users, form.user_id]
  );

  /**
   * The effective tb value for the US Navy calculation:
   * - If the user has typed something, use that.
   * - If not, fall back to tbPrefill (the most recent recorded height).
   */
  const effectiveTb = form.tb !== "" ? parseFloat(form.tb) : (tbPrefill ?? NaN);

  /* live US Navy preview — uses effectiveTb so prefill feeds the preview too */
  const preview = useMemo(
    () =>
      previewBodyFat(
        selectedUser?.kelamin ?? null,
        effectiveTb,
        parseFloat(form.lingkar_leher),
        parseFloat(form.lingkar_pinggang),
        parseFloat(form.lingkar_pinggul)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedUser, effectiveTb, form.lingkar_leher, form.lingkar_pinggang, form.lingkar_pinggul]
  );

  /* fetch users */
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      setUsers(json.data ?? []);
    } catch {
      setError("Gagal memuat users");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  /**
   * Fetch records for the given user.
   * API returns newest-first (orderBy: created_at desc).
   * records[0] is therefore the most recent entry.
   * We extract tb from records[0] as the height prefill for that user.
   */
  const fetchRecords = useCallback(async (uid: string) => {
    if (!uid) {
      setRecords([]);
      setTbPrefill(null);
      return;
    }
    setLoadingRecs(true);
    try {
      const res = await fetch(`/api/body-metrics?user_id=${uid}`);
      const json = await res.json();
      const data: BodyMetric[] = json.data ?? [];
      setRecords(data);

      // Seed height prefill from the most recent record that has a tb value.
      // records[0] is newest-first from the API.
      const latestWithTb = data.find((r) => r.tb != null);
      setTbPrefill(latestWithTb?.tb ?? null);
    } catch {
      setError("Gagal memuat body metrics");
    } finally {
      setLoadingRecs(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* When user_id changes: reset form fields (keep user_id), clear prefill
     immediately, then load fresh records (which will set the new prefill). */
  useEffect(() => {
    if (form.user_id) {
      // Reset form fields but keep user selection
      setForm((p) => ({ ...EMPTY_FORM, user_id: p.user_id }));
      setTbPrefill(null);
      setSubmitOk(null);
      setFormErr(null);
      fetchRecords(form.user_id);
    } else {
      setRecords([]);
      setTbPrefill(null);
    }
    // Only re-run when user_id changes, not when fetchRecords identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.user_id]);

  function setField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    setSubmitOk(null);
    if (!form.user_id) { setFormErr("Pilih user terlebih dahulu."); return; }

    // Use the effective tb (prefill if user didn't override)
    const tbToSend = form.tb !== "" ? parseFloat(form.tb) : tbPrefill;

    setSubmitting(true);
    try {
      const res = await fetch("/api/body-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:          form.user_id,
          tb:               tbToSend ?? null,
          bb:               form.bb               ? parseFloat(form.bb)               : null,
          lingkar_leher:    form.lingkar_leher    ? parseFloat(form.lingkar_leher)    : null,
          lingkar_pinggang: form.lingkar_pinggang ? parseFloat(form.lingkar_pinggang) : null,
          lingkar_pinggul:  form.lingkar_pinggul  ? parseFloat(form.lingkar_pinggul)  : null,
          catatan:          form.catatan || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan");
      const bf = json.kalkulasi?.body_fat;
      setSubmitOk(
        bf != null
          ? `✓ Tersimpan! Body fat: ${bf}% — ${json.kalkulasi.kategori}`
          : "✓ Tersimpan! (Data US Navy belum lengkap, body fat tidak dihitung)"
      );
      // Reset fields but preserve user selection; reload records to update prefill
      setForm((p) => ({ ...EMPTY_FORM, user_id: p.user_id }));
      fetchRecords(form.user_id);
    } catch (e: unknown) {
      setFormErr(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  const kColor = preview ? kategoriColor(preview.kategori) : null;

  /* Is the tb field currently showing the prefilled value (user hasn't typed)? */
  const tbIsPrefilled = form.tb === "" && tbPrefill != null;

  return (
    <div className="noise-bg" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 1120, margin: "0 auto", padding: "40px 24px", width: "100%" }}>

        {/* ── Page header ── */}
        <div className="animate-fade-up" style={{ marginBottom: 32 }}>
          <p className="label" style={{ marginBottom: 6 }}>Logging</p>
          <h1 className="display" style={{ fontSize: "clamp(2.4rem, 4vw, 3.5rem)", color: "var(--txt)" }}>
            Body Metrics
          </h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>

          {/* ── LEFT: Form ── */}
          <div>
            {/* user picker */}
            <div className="card animate-fade-up delay-1" style={{ padding: "22px 24px", marginBottom: 20 }}>
              <label className="label" htmlFor="user-select">Pilih User</label>
              {loadingUsers ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <span className="spinner" />
                  <span style={{ fontSize: 13, color: "var(--txt-2)" }}>Memuat…</span>
                </div>
              ) : (
                <select
                  id="user-select"
                  className="input"
                  value={form.user_id}
                  onChange={(e) => {
                    setField("user_id", e.target.value);
                    setSubmitOk(null);
                    setFormErr(null);
                  }}
                >
                  <option value="" style={{ background: "var(--bg-3)" }}>— Pilih user —</option>
                  {users.map((u) => (
                    <option key={u.id_user} value={u.id_user} style={{ background: "var(--bg-3)" }}>
                      {u.username} {u.kelamin ? `(${u.kelamin})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* metrics form */}
            <div className="card animate-fade-up delay-2" style={{ padding: "24px 24px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)" }}>Log Pengukuran</h2>
                <button
                  type="button"
                  onClick={() => setShowForm(!showForm)}
                  style={{
                    fontSize: 11.5, color: "var(--txt-3)", background: "none", border: "none",
                    cursor: "pointer", textDecoration: "underline",
                  }}
                >
                  {showForm ? "Sembunyikan" : "Tampilkan form"}
                </button>
              </div>

              {!showForm && (
                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  onClick={() => setShowForm(true)}
                  disabled={!form.user_id}
                >
                  + Log Sekarang
                </button>
              )}

              {showForm && (
                <form onSubmit={handleSubmit} noValidate>
                  {/* row 1 — basic */}
                  <p className="label" style={{ marginBottom: 12 }}>Dasar</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                    {/* Tinggi Badan — has prefill logic */}
                    <div>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                        <label className="label" htmlFor="tb" style={{ margin: 0 }}>Tinggi Badan (cm)</label>
                        {tbIsPrefilled && (
                          <span style={{ fontSize: 10, color: "var(--txt-3)", letterSpacing: "0.04em" }}>
                            dari riwayat
                          </span>
                        )}
                      </div>
                      <input
                        id="tb"
                        className="input"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        /*
                         * When form.tb is empty AND we have a prefill, show the prefill
                         * as the input value but styled as muted (placeholder-like).
                         * Once the user types, form.tb is non-empty and overrides the prefill.
                         */
                        value={form.tb !== "" ? form.tb : (tbPrefill != null ? String(tbPrefill) : "")}
                        onChange={(e) => setField("tb", e.target.value)}
                        style={{
                          opacity: tbIsPrefilled ? 0.55 : 1,
                          transition: "opacity 0.2s",
                        }}
                      />
                      {tbIsPrefilled && (
                        <p style={{ fontSize: 10.5, color: "var(--txt-3)", marginTop: 4 }}>
                          Diisi otomatis · ubah jika berbeda
                        </p>
                      )}
                    </div>

                    {/* Berat Badan — unchanged */}
                    <div>
                      <label className="label" htmlFor="bb">Berat Badan (kg)</label>
                      <input
                        id="bb"
                        className="input"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        value={form.bb}
                        onChange={(e) => setField("bb", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* row 2 — US Navy */}
                  <p className="label" style={{ marginBottom: 12 }}>US Navy Method (cm)</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                    {[
                      { id: "leher",    label: "Lingkar Leher",    field: "lingkar_leher"    as const },
                      { id: "pinggang", label: "Lingkar Pinggang",  field: "lingkar_pinggang" as const },
                      { id: "pinggul",  label: "Lingkar Pinggul",   field: "lingkar_pinggul"  as const },
                    ].map(({ id, label, field }) => (
                      <div key={id}>
                        <label className="label" htmlFor={id}>
                          {label}
                          {id === "pinggul" && selectedUser?.kelamin === "WANITA" && (
                            <span style={{ color: "var(--accent)", marginLeft: 4 }}>*</span>
                          )}
                        </label>
                        <input
                          id={id}
                          className="input"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="0.0"
                          value={form[field]}
                          onChange={(e) => setField(field, e.target.value)}
                        />
                      </div>
                    ))}
                    {/* catatan */}
                    <div>
                      <label className="label" htmlFor="catatan">Catatan</label>
                      <input
                        id="catatan"
                        className="input"
                        type="text"
                        placeholder="opsional…"
                        value={form.catatan}
                        onChange={(e) => setField("catatan", e.target.value)}
                      />
                    </div>
                  </div>

                  {formErr && (
                    <p style={{ fontSize: 13, color: "var(--red)", marginBottom: 14 }}>⚠ {formErr}</p>
                  )}
                  {submitOk && (
                    <p style={{ fontSize: 13, color: "var(--green)", marginBottom: 14 }}>{submitOk}</p>
                  )}

                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="submit" className="btn btn-primary" disabled={submitting || !form.user_id}>
                      {submitting ? <><span className="spinner" /> Menyimpan…</> : "Simpan Metrics"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => { setShowForm(false); setFormErr(null); setSubmitOk(null); }}
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* ── RIGHT: Live preview + history ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Live US Navy preview */}
            <div
              className="card animate-fade-up delay-2"
              style={{
                padding: "22px 22px",
                border: preview ? `1px solid ${kColor!.color}33` : "1px solid var(--border)",
                transition: "border-color 0.3s var(--ease)",
              }}
            >
              <p className="label" style={{ marginBottom: 16 }}>Live Preview</p>

              {!preview && (
                <p style={{ fontSize: 13, color: "var(--txt-3)", lineHeight: 1.6 }}>
                  Isi tinggi badan, lingkar leher, &amp; pinggang untuk melihat estimasi body fat secara real-time.
                  {selectedUser?.kelamin === "WANITA" && " Untuk wanita, lingkar pinggul juga diperlukan."}
                </p>
              )}

              {preview && (
                <div className="animate-fade-in">
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 14 }}>
                    <span
                      className="display"
                      style={{ fontSize: "3.5rem", color: kColor!.color, lineHeight: 1 }}
                    >
                      {preview.value}%
                    </span>
                    <span
                      className="badge"
                      style={{ background: kColor!.bg, color: kColor!.color, marginBottom: 4 }}
                    >
                      {preview.kategori}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--txt-3)" }}>
                    Estimasi US Navy · belum disimpan
                  </p>

                  {/* visual fat bar */}
                  <div style={{ marginTop: 16 }}>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 99,
                        background: "var(--surface-2)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min((preview.value / 40) * 100, 100)}%`,
                          background: kColor!.color,
                          borderRadius: 99,
                          transition: "width 0.4s var(--ease)",
                          boxShadow: `0 0 8px ${kColor!.color}55`,
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      <span style={{ fontSize: 10, color: "var(--txt-3)" }}>0%</span>
                      <span style={{ fontSize: 10, color: "var(--txt-3)" }}>40%+</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* History list — API returns newest-first, so display order is newest at top */}
            <div className="card animate-fade-up delay-3" style={{ padding: "20px 22px" }}>
              <p className="label" style={{ marginBottom: 14 }}>
                Riwayat {form.user_id ? `· ${records.length} entri` : ""}
              </p>

              {!form.user_id && (
                <p style={{ fontSize: 13, color: "var(--txt-3)" }}>
                  Pilih user untuk melihat riwayat.
                </p>
              )}

              {form.user_id && loadingRecs && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="spinner" />
                  <span style={{ fontSize: 13, color: "var(--txt-2)" }}>Memuat…</span>
                </div>
              )}

              {form.user_id && !loadingRecs && records.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--txt-3)" }}>
                  Belum ada entri untuk user ini.
                </p>
              )}

              {!loadingRecs && records.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto", paddingRight: 4 }}>
                  {records.map((r) => {
                    const bfColor = r.body_fat != null
                      ? kategoriColor(
                          r.body_fat < 5  ? "Sangat Kurus"
                        : r.body_fat < 13 ? "Atlet"
                        : r.body_fat < 17 ? "Bugar"
                        : r.body_fat < 24 ? "Rata-rata"
                        : "Gemoy"
                        )
                      : null;

                    return (
                      <div
                        key={r.id_bm}
                        style={{
                          background: "var(--bg-3)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--r-md)",
                          padding: "12px 14px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 11.5, color: "var(--txt-3)" }}>{fmtDate(r.created_at)}</span>
                          {r.body_fat != null && bfColor && (
                            <span
                              className="mono"
                              style={{ fontSize: 13, fontWeight: 500, color: bfColor.color }}
                            >
                              {r.body_fat}%
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          {r.bb  != null && <span style={{ fontSize: 11.5, color: "var(--txt-2)" }}>BB {r.bb} kg</span>}
                          {r.tb  != null && <span style={{ fontSize: 11.5, color: "var(--txt-2)" }}>TB {r.tb} cm</span>}
                          {r.lingkar_pinggang != null && <span style={{ fontSize: 11.5, color: "var(--txt-2)" }}>↔ {r.lingkar_pinggang} cm</span>}
                        </div>
                        {r.catatan && (
                          <p style={{ fontSize: 11.5, color: "var(--txt-3)", marginTop: 4, fontStyle: "italic" }}>
                            &ldquo;{r.catatan}&rdquo;
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {error && (
              <p style={{ fontSize: 12, color: "var(--red)" }}>⚠ {error}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
