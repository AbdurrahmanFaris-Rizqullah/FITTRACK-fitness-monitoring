"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

/* ─── types ─────────────────────────────────────────────── */
interface User {
  id_user: string;
  username: string;
  kelamin: "PRIA" | "WANITA" | null;
  tanggal_lahir: string | null;
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

/* ─── helpers ───────────────────────────────────────────── */
function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function kategori(bf: number, kelamin: "PRIA" | "WANITA" | null) {
  if (!kelamin) return { label: "—", color: "var(--txt-3)" };
  if (kelamin === "PRIA") {
    if (bf < 5)  return { label: "Sangat Kurus", color: "var(--red)" };
    if (bf < 13) return { label: "Atlet",        color: "var(--blue)" };
    if (bf < 17) return { label: "Bugar",         color: "var(--accent)" };
    if (bf < 24) return { label: "Rata-rata",     color: "var(--amber)" };
    return             { label: "Gemoy",          color: "var(--red)" };
  }
  if (bf < 13) return { label: "Sangat Kurus", color: "var(--red)" };
  if (bf < 20) return { label: "Atlet",        color: "var(--blue)" };
  if (bf < 24) return { label: "Bugar",         color: "var(--accent)" };
  if (bf < 31) return { label: "Rata-rata",     color: "var(--amber)" };
  return           { label: "Gemoy",          color: "var(--red)" };
}

function delta(arr: (number | null)[]): { val: number; positive: boolean } | null {
  const clean = arr.filter((v): v is number => v != null);
  if (clean.length < 2) return null;
  const d = parseFloat((clean[clean.length - 1] - clean[0]).toFixed(2));
  return { val: d, positive: d >= 0 };
}

/* ─── custom tooltip ────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border-2)",
        borderRadius: "var(--r-md)",
        padding: "10px 14px",
        fontSize: 12,
        color: "var(--txt)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        minWidth: 120,
      }}
    >
      <p style={{ color: "var(--txt-3)", marginBottom: 6, fontSize: 11 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.value} <span style={{ color: "var(--txt-3)", fontWeight: 400 }}>{p.name}</span>
        </p>
      ))}
    </div>
  );
}

/* ─── stat card ─────────────────────────────────────────── */
function StatCard({
  label,
  value,
  unit,
  color,
  delta: d,
  sub,
  delay,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
  color?: string;
  delta?: { val: number; positive: boolean } | null;
  sub?: string;
  delay?: number;
}) {
  return (
    <div
      className={`stat-card animate-fade-up${delay ? ` delay-${delay}` : ""}`}
      style={{ minWidth: 0 }}
    >
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={{ color: color ?? "var(--txt)", marginTop: 8 }}>
        {value ?? "—"}
        {unit && value != null && (
          <span style={{ fontSize: "1.1rem", color: "var(--txt-2)", marginLeft: 4 }}>{unit}</span>
        )}
      </div>
      {d != null && (
        <div
          style={{
            fontSize: 11.5,
            marginTop: 6,
            color: d.positive ? "var(--red)" : "var(--green)",
            fontWeight: 600,
          }}
        >
          {d.positive ? "▲" : "▼"} {Math.abs(d.val)}{unit} sejak awal
        </div>
      )}
      {sub && !d && (
        <div style={{ fontSize: 11.5, marginTop: 6, color: "var(--txt-3)" }}>{sub}</div>
      )}
    </div>
  );
}

/* ─── main component (inner — uses searchParams) ─────────── */
function DashboardInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const urlUserId    = searchParams.get("user_id") ?? "";

  const [users, setUsers]     = useState<User[]>([]);
  const [records, setRecords] = useState<BodyMetric[]>([]);
  const [userId, setUserId]   = useState(urlUserId);
  const [loadingU, setLoadingU] = useState(true);
  const [loadingR, setLoadingR] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  /* fetch users */
  useEffect(() => {
    (async () => {
      setLoadingU(true);
      try {
        const res  = await fetch("/api/users");
        const json = await res.json();
        const list: User[] = json.data ?? [];
        setUsers(list);
        // if no url param, default to first user
        if (!urlUserId && list.length > 0) setUserId(list[0].id_user);
      } catch {
        setError("Gagal memuat users");
      } finally {
        setLoadingU(false);
      }
    })();
  }, [urlUserId]);

  /* fetch records when userId changes */
  const fetchRecords = useCallback(async (uid: string) => {
    if (!uid) { setRecords([]); return; }
    setLoadingR(true);
    setError(null);
    try {
      const res  = await fetch(`/api/body-metrics?user_id=${uid}`);
      const json = await res.json();
      // records come newest-first from API, reverse for charts
      setRecords([...(json.data ?? [])].reverse());
    } catch {
      setError("Gagal memuat body metrics");
    } finally {
      setLoadingR(false);
    }
  }, []);

  useEffect(() => { fetchRecords(userId); }, [userId, fetchRecords]);

  /* sync url param → local state */
  useEffect(() => { if (urlUserId) setUserId(urlUserId); }, [urlUserId]);

  function switchUser(uid: string) {
    setUserId(uid);
    router.replace(`/dashboard?user_id=${uid}`, { scroll: false });
  }

  const selectedUser = useMemo(() => users.find((u) => u.id_user === userId) ?? null, [users, userId]);

  /* chart data */
  const chartData = useMemo(
    () =>
      records.map((r) => ({
        date:      fmtShort(r.created_at),
        bb:        r.bb,
        body_fat:  r.body_fat,
        pinggang:  r.lingkar_pinggang,
        leher:     r.lingkar_leher,
      })),
    [records]
  );

  /* latest record stats */
  const latest = records[records.length - 1] ?? null;
  const latestKat =
    latest?.body_fat != null
      ? kategori(latest.body_fat, selectedUser?.kelamin ?? null)
      : null;

  const bfDelta  = delta(records.map((r) => r.body_fat));
  const bbDelta  = delta(records.map((r) => r.bb));

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div className="noise-bg" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 1120, margin: "0 auto", padding: "40px 24px 60px", width: "100%" }}>

        {/* ── Page header ── */}
        <div
          className="animate-fade-up"
          style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}
        >
          <div>
            <p className="label" style={{ marginBottom: 6 }}>Overview</p>
            <h1 className="display" style={{ fontSize: "clamp(2.4rem, 4vw, 3.5rem)", color: "var(--txt)" }}>
              Dashboard
            </h1>
          </div>

          {/* User switcher */}
          {loadingU ? (
            <span className="spinner" />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {users.map((u) => (
                <button
                  key={u.id_user}
                  onClick={() => switchUser(u.id_user)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: "var(--r-md)",
                    fontSize: 13,
                    fontWeight: userId === u.id_user ? 600 : 400,
                    color: userId === u.id_user ? "var(--accent)" : "var(--txt-2)",
                    background: userId === u.id_user ? "var(--accent-dim)" : "var(--surface)",
                    border: `1px solid ${userId === u.id_user ? "var(--accent-dim)" : "var(--border)"}`,
                    cursor: "pointer",
                    transition: "all 0.15s var(--ease)",
                  }}
                >
                  {u.username}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              background: "var(--red-dim)",
              border: "1px solid rgba(255,77,109,0.2)",
              borderRadius: "var(--r-md)",
              padding: "12px 16px",
              color: "var(--red)",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* ── No user ── */}
        {!loadingU && users.length === 0 && (
          <div className="card" style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)", marginBottom: 20 }}>
              Belum ada user
            </p>
            <a href="/users" className="btn btn-primary">Tambah User →</a>
          </div>
        )}

        {/* ── Loading records ── */}
        {loadingR && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "48px 0", justifyContent: "center" }}>
            <span className="spinner" style={{ width: 24, height: 24, borderWidth: 2.5 }} />
            <span style={{ color: "var(--txt-2)", fontSize: 14 }}>Memuat data…</span>
          </div>
        )}

        {/* ── Dashboard content ── */}
        {!loadingR && selectedUser && (
          <>
            {/* user meta strip */}
            <div
              className="animate-fade-up delay-1"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 28,
                padding: "14px 18px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: selectedUser.kelamin === "WANITA" ? "var(--accent-dim)" : "var(--blue-dim)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {selectedUser.kelamin === "WANITA" ? "🧘‍♀️" : "💪"}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)" }}>{selectedUser.username}</div>
                <div style={{ fontSize: 11.5, color: "var(--txt-3)" }}>
                  {selectedUser.kelamin ?? "Kelamin belum diset"}
                  {selectedUser.tanggal_lahir && (
                    <> · {new Date(selectedUser.tanggal_lahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</>
                  )}
                </div>
              </div>
              {latestKat && (
                <span
                  style={{
                    marginLeft: "auto",
                    padding: "5px 14px",
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    background: latestKat.color + "22",
                    color: latestKat.color,
                    border: `1px solid ${latestKat.color}44`,
                  }}
                >
                  {latestKat.label}
                </span>
              )}
              <span style={{ fontSize: 12, color: "var(--txt-3)", marginLeft: latestKat ? 0 : "auto" }}>
                {records.length} entri
              </span>
            </div>

            {/* ── Stat cards ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 14,
                marginBottom: 28,
              }}
            >
              <StatCard
                label="Body Fat Terakhir"
                value={latest?.body_fat ?? null}
                unit="%"
                color={latestKat?.color}
                delta={bfDelta}
                delay={1}
              />
              <StatCard
                label="Berat Badan"
                value={latest?.bb ?? null}
                unit="kg"
                color="var(--blue)"
                delta={bbDelta}
                delay={2}
              />
              <StatCard
                label="Tinggi Badan"
                value={latest?.tb ?? null}
                unit="cm"
                color="var(--txt)"
                sub="dari entri terakhir"
                delay={3}
              />
              <StatCard
                label="Lingkar Pinggang"
                value={latest?.lingkar_pinggang ?? null}
                unit="cm"
                color="var(--amber)"
                delay={4}
              />
            </div>

            {/* ── No records empty state ── */}
            {records.length === 0 && (
              <div className="card animate-fade-in" style={{ padding: "60px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)", marginBottom: 8 }}>
                  Belum ada data untuk {selectedUser.username}
                </p>
                <p style={{ fontSize: 13, color: "var(--txt-2)", marginBottom: 24 }}>
                  Log pengukuran pertama untuk mulai melihat grafik.
                </p>
                <a href="/body-metrics" className="btn btn-primary">+ Log Metrics</a>
              </div>
            )}

            {/* ── Charts ── */}
            {records.length >= 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Body Fat area chart */}
                {chartData.some((d) => d.body_fat != null) && (
                  <div className="card animate-fade-up delay-2" style={{ padding: "24px 20px 16px" }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--txt-3)", marginBottom: 18 }}>
                      Body Fat % · Tren
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                        <defs>
                          <linearGradient id="bfGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#c8ff00" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#c8ff00" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: "var(--txt-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "var(--txt-3)", fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="body_fat"
                          name="%"
                          stroke="#c8ff00"
                          strokeWidth={2}
                          fill="url(#bfGrad)"
                          dot={{ fill: "#c8ff00", r: 3, strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: "#c8ff00", stroke: "var(--bg)", strokeWidth: 2 }}
                          connectNulls
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Berat Badan + Pinggang two-column */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                  {chartData.some((d) => d.bb != null) && (
                    <div className="card animate-fade-up delay-3" style={{ padding: "24px 20px 16px" }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--txt-3)", marginBottom: 18 }}>
                        Berat Badan (kg)
                      </p>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tick={{ fill: "var(--txt-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "var(--txt-3)", fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="bb"
                            name="kg"
                            stroke="var(--blue)"
                            strokeWidth={2}
                            dot={{ fill: "var(--blue)", r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, stroke: "var(--bg)", strokeWidth: 2 }}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {chartData.some((d) => d.pinggang != null) && (
                    <div className="card animate-fade-up delay-3" style={{ padding: "24px 20px 16px" }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--txt-3)", marginBottom: 18 }}>
                        Lingkar Pinggang (cm)
                      </p>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tick={{ fill: "var(--txt-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "var(--txt-3)", fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="pinggang" name="cm" fill="var(--amber)" radius={[4, 4, 0, 0]} opacity={0.85} />
                          {selectedUser.kelamin === "PRIA" && (
                            <ReferenceLine y={94} stroke="var(--red)" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "Batas risiko", fill: "var(--red)", fontSize: 9 }} />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Neck circumference */}
                {chartData.some((d) => d.leher != null) && (
                  <div className="card animate-fade-up delay-4" style={{ padding: "24px 20px 16px" }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--txt-3)", marginBottom: 18 }}>
                      Lingkar Leher (cm)
                    </p>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: "var(--txt-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "var(--txt-3)", fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="leher"
                          name="cm"
                          stroke="var(--green)"
                          strokeWidth={2}
                          dot={{ fill: "var(--green)", r: 3, strokeWidth: 0 }}
                          activeDot={{ r: 5, stroke: "var(--bg)", strokeWidth: 2 }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* single entry — show a nudge to log more */}
            {records.length === 1 && (
              <div
                className="card animate-fade-in"
                style={{
                  padding: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                  borderColor: "var(--accent-dim)",
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--txt)", marginBottom: 4 }}>
                    1 entri logged
                  </p>
                  <p style={{ fontSize: 13, color: "var(--txt-2)" }}>
                    Butuh ≥ 2 entri untuk menampilkan grafik tren.
                  </p>
                </div>
                <a href="/body-metrics" className="btn btn-primary" style={{ flexShrink: 0 }}>
                  + Log Entri Berikutnya
                </a>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ─── page export (wraps in Suspense for useSearchParams) ── */
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
