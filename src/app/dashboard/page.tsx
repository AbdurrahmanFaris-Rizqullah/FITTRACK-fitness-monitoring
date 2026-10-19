"use client";

import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import BodyDiagram from "../components/BodyDiagram";
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
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";

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

/**
 * Chart data point.
 * `id` = UUID used as Recharts XAxis dataKey (prevents same-day collision).
 * `date` = human-readable display label resolved via tickFormatter / tooltip.
 */
interface ChartPoint {
  id: string;
  date: string;
  bb: number | null;
  body_fat: number | null;
  pinggang: number | null;
  leher: number | null;
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
    if (bf < 17) return { label: "Bugar",        color: "var(--accent)" };
    if (bf < 24) return { label: "Rata-rata",    color: "var(--amber)" };
    return             { label: "Gemoy",         color: "var(--red)" };
  }
  if (bf < 13) return { label: "Sangat Kurus", color: "var(--red)" };
  if (bf < 20) return { label: "Atlet",        color: "var(--blue)" };
  if (bf < 24) return { label: "Bugar",        color: "var(--accent)" };
  if (bf < 31) return { label: "Rata-rata",    color: "var(--amber)" };
  return           { label: "Gemoy",         color: "var(--red)" };
}

function delta(arr: (number | null)[]): { val: number; positive: boolean } | null {
  const clean = arr.filter((v): v is number => v != null);
  if (clean.length < 2) return null;
  const d = parseFloat((clean[clean.length - 1] - clean[0]).toFixed(2));
  return { val: d, positive: d >= 0 };
}

/* ─── custom tooltip ─────────────────────────────────────
 * Recharts passes the UUID as `label` — we resolve it back
 * to the human-readable date via a chartData lookup.
 */
type CustomTooltipProps = TooltipContentProps<ValueType, NameType> & {
  chartData: ChartPoint[];
};

function CustomTooltip({ active, payload, label, chartData }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const displayDate =
    chartData.find((p) => p.id === String(label))?.date ?? String(label ?? "");
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
      <p style={{ color: "var(--txt-2)", marginBottom: 6, fontSize: 11 }}>{displayDate}</p>
      {payload.map((p, i) => (
        <p key={`${String(p.name)}-${i}`} style={{ color: p.color ?? "var(--txt)", fontWeight: 600 }}>
          {String(p.value)}{" "}
          <span style={{ color: "var(--txt-2)", fontWeight: 400 }}>{String(p.name)}</span>
        </p>
      ))}
    </div>
  );
}

/* ─── shared XAxis props ─────────────────────────────────
 * minTickGap: prevents label crowding when many records share
 *   nearby dates (e.g. logging daily). Recharts will drop ticks
 *   that would render closer than minTickGap px apart.
 * interval="preserveStartEnd": always shows first + last label.
 */
function makeXAxisProps(chartData: ChartPoint[]) {
  return {
    dataKey: "id",
    tickFormatter: (id: string) =>
      chartData.find((p) => p.id === id)?.date ?? "",
    tick: { fill: "var(--txt-3)", fontSize: 10 },
    axisLine: false,
    tickLine: false,
    interval: "preserveStartEnd" as const,
    minTickGap: 40,
  };
}

/* ─── skeleton components ────────────────────────────────
 * Shown while records are loading so there is no layout jump.
 */
function SkeletonStatCard() {
  return (
    <div className="skeleton-stat-card">
      <div className="skeleton" style={{ height: 11, width: "55%", borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 44, width: "70%", borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 11, width: "45%", borderRadius: 4 }} />
    </div>
  );
}

function SkeletonChartCard({ height = 160 }: { height?: number }) {
  return (
    <div className="skeleton-chart-card">
      <div className="skeleton" style={{ height: 11, width: "40%", borderRadius: 4, marginBottom: 18 }} />
      <div className="skeleton" style={{ height, borderRadius: "var(--r-md)" }} />
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
      {/* label — uses --txt-3 which is now WCAG AA compliant */}
      <div className="stat-card-label">{label}</div>

      <div className="stat-card-value" style={{ color: color ?? "var(--txt)", marginTop: 8 }}>
        {value ?? "—"}
        {unit && value != null && (
          <span style={{ fontSize: "1.1rem", color: "var(--txt-2)", marginLeft: 4 }}>{unit}</span>
        )}
      </div>

      {/* delta trend — positive = went up = bad (body fat / weight) */}
      {d != null && (
        <div
          style={{
            fontSize: 12,
            marginTop: 6,
            color: d.positive ? "var(--red)" : "var(--green)",
            fontWeight: 600,
          }}
        >
          {d.positive ? "▲" : "▼"} {Math.abs(d.val)}{unit} sejak awal
        </div>
      )}

      {/* sub-label — lifted to --txt-2 for WCAG AA contrast */}
      {sub && !d && (
        <div style={{ fontSize: 12, marginTop: 6, color: "var(--txt-2)" }}>{sub}</div>
      )}
    </div>
  );
}

/* ─── empty state ────────────────────────────────────────── */
function EmptyState({ username }: { username: string }) {
  return (
    <div
      className="card animate-fade-in"
      style={{
        padding: "48px 32px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        border: "1px solid var(--border-2)",
      }}
    >
      {/* icon ring */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "var(--accent-dim)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          marginBottom: 4,
        }}
      >
        📋
      </div>

      <p style={{ fontSize: 15, fontWeight: 700, color: "var(--txt)", margin: 0 }}>
        Belum ada data untuk <span style={{ color: "var(--accent)" }}>{username}</span>
      </p>
      <p style={{ fontSize: 13, color: "var(--txt-2)", margin: 0, maxWidth: 300, lineHeight: 1.6 }}>
        Log pengukuran pertama untuk mulai melihat grafik tren dan diagram tubuh.
      </p>

      <a
        href="/body-metrics"
        className="btn btn-primary"
        style={{ marginTop: 8, padding: "10px 24px", fontSize: 13.5 }}
      >
        + Log Metrics Pertama
      </a>
    </div>
  );
}

/* ─── chart section label ────────────────────────────────── */
function ChartLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--txt-2)",   /* lifted from --txt-3 for WCAG AA */
        marginBottom: 16,
        margin: "0 0 16px",
      }}
    >
      {children}
    </p>
  );
}

/* ─── DashboardInner ─────────────────────────────────────── */
function DashboardInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const urlUserId    = searchParams.get("user_id") ?? "";

  const [users, setUsers]       = useState<User[]>([]);
  const [records, setRecords]   = useState<BodyMetric[]>([]);
  const [userId, setUserId]     = useState(urlUserId);
  const [loadingU, setLoadingU] = useState(true);
  const [loadingR, setLoadingR] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const requestedUserIdRef = useRef<string>("");

  /* ── fetch records ────────────────────────────────────── */
  const fetchRecords = useCallback(async (uid: string) => {
    if (!uid) { setRecords([]); return; }
    requestedUserIdRef.current = uid;
    setLoadingR(true);
    setError(null);
    try {
      const res  = await fetch(`/api/body-metrics?user_id=${uid}`);
      const json = await res.json();
      if (requestedUserIdRef.current !== uid) return;
      setRecords([...(json.data ?? [])].reverse()); // oldest-first for charts
    } catch {
      if (requestedUserIdRef.current === uid) setError("Gagal memuat body metrics");
    } finally {
      if (requestedUserIdRef.current === uid) setLoadingR(false);
    }
  }, []);

  /* ── fetch users (once on mount) ─────────────────────── */
  useEffect(() => {
    (async () => {
      setLoadingU(true);
      try {
        const res  = await fetch("/api/users");
        const json = await res.json();
        const list: User[] = json.data ?? [];
        setUsers(list);
        setUserId((cur) => (!cur && list.length > 0 ? list[0].id_user : cur));
      } catch {
        setError("Gagal memuat users");
      } finally {
        setLoadingU(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── sync URL → state for back/forward navigation ───── */
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (urlUserId) setUserId(urlUserId);
  }, [urlUserId]);

  useEffect(() => { fetchRecords(userId); }, [userId, fetchRecords]);

  function switchUser(uid: string) {
    setUserId(uid);
    router.replace(`/dashboard?user_id=${uid}`, { scroll: false });
  }

  const selectedUser = useMemo(
    () => users.find((u) => u.id_user === userId) ?? null,
    [users, userId]
  );

  /* ── chart data (UUID key, date display label) ────────── */
  const chartData = useMemo<ChartPoint[]>(
    () =>
      records.map((r) => ({
        id:       r.id_bm,
        date:     fmtShort(r.created_at),
        bb:       r.bb,
        body_fat: r.body_fat,
        pinggang: r.lingkar_pinggang,
        leher:    r.lingkar_leher,
      })),
    [records]
  );

  const latest    = records[records.length - 1] ?? null;
  const latestKat = latest?.body_fat != null
    ? kategori(latest.body_fat, selectedUser?.kelamin ?? null)
    : null;
  const bfDelta   = delta(records.map((r) => r.body_fat));
  const bbDelta   = delta(records.map((r) => r.bb));

  const xAxisProps = useMemo(() => makeXAxisProps(chartData), [chartData]);

  const renderTooltip = useCallback(
    (props: TooltipContentProps<ValueType, NameType>) => (
      <CustomTooltip {...props} chartData={chartData} />
    ),
    [chartData]
  );

  /* ── Y-axis shared style ─────────────────────────────── */
  const yAxisStyle = {
    tick: { fill: "var(--txt-3)", fontSize: 10 },
    axisLine: false,
    tickLine: false,
    domain: ["auto", "auto"] as ["auto", "auto"],
  };

  /* ── render ──────────────────────────────────────────── */
  return (
    <div
      className="noise-bg"
      style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}
    >
      <Navbar />

      <main
        className="main-pad"
        style={{ paddingBottom: 60 }}
      >
        {/* ── Page header ── */}
        <div
          className="animate-fade-up"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <p className="label" style={{ marginBottom: 6 }}>Overview</p>
            <h1
              className="display"
              style={{ fontSize: "clamp(2.4rem, 4vw, 3.5rem)", color: "var(--txt)" }}
            >
              Dashboard
            </h1>
          </div>

          {loadingU ? (
            <span className="spinner" aria-label="Memuat users…" />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                /* on mobile, allow horizontal scroll if many users */
                overflowX: "auto",
                paddingBottom: 2,
              }}
            >
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
                    flexShrink: 0,
                    minHeight: 38,
                    whiteSpace: "nowrap",
                  }}
                >
                  {u.username}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Error banner ── */}
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

        {/* ── No users ── */}
        {!loadingU && users.length === 0 && (
          <div className="card" style={{ padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)", marginBottom: 20 }}>
              Belum ada user
            </p>
            <a href="/users" className="btn btn-primary">Tambah User →</a>
          </div>
        )}

        {/* ── Skeleton loaders while records fetch ── */}
        {loadingR && (
          <div className="animate-fade-in">
            {/* stat card skeletons */}
            <div className="stat-grid" style={{ marginBottom: 28 }}>
              {[0, 1, 2, 3].map((i) => <SkeletonStatCard key={i} />)}
            </div>

            {/* diagram + chart row skeleton */}
            <div className="diagram-row" style={{ marginBottom: 24 }}>
              <div className="diagram-col">
                <div
                  className="skeleton"
                  style={{ height: 420, borderRadius: "var(--r-lg)" }}
                />
              </div>
              <SkeletonChartCard height={200} />
            </div>

            {/* bottom charts skeleton */}
            <div className="chart-grid">
              <SkeletonChartCard height={160} />
              <SkeletonChartCard height={160} />
              <SkeletonChartCard height={140} />
            </div>
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
                marginBottom: 24,
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
                  background:
                    selectedUser.kelamin === "WANITA"
                      ? "var(--accent-dim)"
                      : "var(--blue-dim)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {selectedUser.kelamin === "WANITA" ? "🧘‍♀️" : "💪"}
              </div>

              {/* name + subtitle — allow text to wrap on narrow screens */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--txt)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedUser.username}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--txt-2)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedUser.kelamin ?? "Kelamin belum diset"}
                  {selectedUser.tanggal_lahir && (
                    <>
                      {" · "}
                      {new Date(selectedUser.tanggal_lahir).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </>
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
              <span
                style={{
                  fontSize: 12,
                  color: "var(--txt-2)",
                  marginLeft: latestKat ? 0 : "auto",
                }}
              >
                {records.length} entri
              </span>
            </div>

            {/* ── Stat cards — responsive via .stat-grid CSS class ── */}
            <div className="stat-grid">
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

            {/* ── Body diagram + right panel ──────────────────────
             *
             * Layout fix: use .diagram-row CSS class (defined in globals.css)
             * instead of an inline gridTemplateColumns so media queries work.
             *
             * align-items is deliberately omitted from the class (defaults to
             * "stretch") so both columns grow to the same height — this prevents
             * the body diagram card from clipping its SVG content against a
             * shorter right card.
             ─────────────────────────────────────────────────── */}
            <div className="diagram-row animate-fade-up delay-2">
              {/* left: body diagram — wrapped in .diagram-col for responsive centering */}
              <div className="diagram-col">
                <BodyDiagram
                  leher={latest?.lingkar_leher ?? null}
                  pinggang={latest?.lingkar_pinggang ?? null}
                  pinggul={latest?.lingkar_pinggul ?? null}
                  bb={latest?.bb ?? null}
                  kelamin={selectedUser.kelamin}
                />
              </div>

              {/* right: contextual panel */}
              {records.length === 0 && (
                <EmptyState username={selectedUser.username} />
              )}

              {records.length === 1 && (
                <div
                  className="card animate-fade-in"
                  style={{
                    padding: "28px 24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 12,
                    border: "1px solid var(--border-2)",
                  }}
                >
                  {/* progress bar: 1 of 2 */}
                  <div style={{ marginBottom: 4 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 12, color: "var(--txt-2)", fontWeight: 600 }}>
                        Progress ke grafik tren
                      </span>
                      <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>
                        1 / 2
                      </span>
                    </div>
                    <div
                      style={{
                        height: 5,
                        background: "var(--surface-2)",
                        borderRadius: 99,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: "50%",
                          background: "var(--accent)",
                          borderRadius: 99,
                          boxShadow: "0 0 8px var(--accent-glow)",
                        }}
                      />
                    </div>
                  </div>

                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--txt)", margin: 0 }}>
                    1 entri logged ✓
                  </p>
                  <p style={{ fontSize: 13, color: "var(--txt-2)", margin: 0, lineHeight: 1.6 }}>
                    Butuh satu lagi untuk menampilkan grafik tren. Log entri
                    berikutnya setelah latihan!
                  </p>
                  <a
                    href="/body-metrics"
                    className="btn btn-primary"
                    style={{ alignSelf: "flex-start", marginTop: 4 }}
                  >
                    + Log Entri Berikutnya
                  </a>
                </div>
              )}

              {records.length >= 2 && chartData.some((d) => d.body_fat != null) && (
                <div className="card animate-fade-up delay-3" style={{ padding: "24px 20px 16px" }}>
                  <ChartLabel>Body Fat % · Tren</ChartLabel>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                      data={chartData}
                      margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="bfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#c8ff00" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#c8ff00" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="var(--border)"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis {...xAxisProps} />
                      <YAxis {...yAxisStyle} />
                      <Tooltip content={renderTooltip} />
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

              {/* fallback when ≥2 records but no body_fat data */}
              {records.length >= 2 && !chartData.some((d) => d.body_fat != null) && (
                <div
                  className="card"
                  style={{
                    padding: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 8,
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: 13, color: "var(--txt-2)" }}>
                    Belum ada data Body Fat untuk ditampilkan.
                  </p>
                  <p style={{ fontSize: 12, color: "var(--txt-3)" }}>
                    Pastikan lingkar leher &amp; pinggang diisi agar US Navy
                    menghitung % lemak tubuh.
                  </p>
                </div>
              )}
            </div>

            {/* ── Bottom charts (≥2 records) — 3-col responsive grid ── */}
            {records.length >= 2 && (
              <div className="chart-grid animate-fade-up delay-3">

                {/* Weight */}
                {chartData.some((d) => d.bb != null) && (
                  <div className="card" style={{ padding: "24px 20px 16px" }}>
                    <ChartLabel>Berat Badan (kg)</ChartLabel>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart
                        data={chartData}
                        margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                      >
                        <CartesianGrid
                          stroke="var(--border)"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis {...xAxisProps} />
                        <YAxis {...yAxisStyle} />
                        <Tooltip content={renderTooltip} />
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

                {/* Waist */}
                {chartData.some((d) => d.pinggang != null) && (
                  <div className="card" style={{ padding: "24px 20px 16px" }}>
                    <ChartLabel>Lingkar Pinggang (cm)</ChartLabel>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart
                        data={chartData}
                        margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                      >
                        <CartesianGrid
                          stroke="var(--border)"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis {...xAxisProps} />
                        <YAxis {...yAxisStyle} />
                        <Tooltip content={renderTooltip} />
                        <Bar
                          dataKey="pinggang"
                          name="cm"
                          fill="var(--amber)"
                          radius={[4, 4, 0, 0]}
                          opacity={0.85}
                        />
                        {selectedUser.kelamin === "PRIA" && (
                          <ReferenceLine
                            y={94}
                            stroke="var(--red)"
                            strokeDasharray="4 3"
                            strokeWidth={1.5}
                            label={{
                              value: "Batas risiko",
                              fill: "var(--red)",
                              fontSize: 9,
                            }}
                          />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Neck */}
                {chartData.some((d) => d.leher != null) && (
                  <div className="card" style={{ padding: "24px 20px 16px" }}>
                    <ChartLabel>Lingkar Leher (cm)</ChartLabel>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart
                        data={chartData}
                        margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                      >
                        <CartesianGrid
                          stroke="var(--border)"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis {...xAxisProps} />
                        <YAxis {...yAxisStyle} />
                        <Tooltip content={renderTooltip} />
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
          </>
        )}
      </main>
    </div>
  );
}

/* ─── page export ────────────────────────────────────────── */
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
