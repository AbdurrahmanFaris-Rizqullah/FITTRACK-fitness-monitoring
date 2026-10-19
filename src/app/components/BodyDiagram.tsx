"use client";

/**
 * BodyDiagram — redesigned
 *
 * Bright, human-centred body measurement card with:
 *  - Gender-specific SVG illustrations (skin tone, clothing, braid for women)
 *  - Hover-interactive measurement markers with tooltips
 *  - Clean white-card aesthetic that pops against the dark dashboard
 *  - Responsive layout; labels never overlap the figure
 *
 * Props are identical to the previous version — no dashboard changes needed.
 */

import { useState } from "react";

/* ─── types ─────────────────────────────────────────────── */
interface Props {
  leher:    number | null;
  pinggang: number | null;
  pinggul:  number | null;
  bb:       number | null;
  kelamin:  "PRIA" | "WANITA" | null;
}

type MeasurementKey = "leher" | "pinggang" | "pinggul";

interface Measurement {
  key:   MeasurementKey;
  label: string;
  value: number | null;
  unit:  string;
  color: string;           // hex — used inside SVG (no CSS vars)
  side:  "left" | "right";
  /** dot position on figure, 0-1 fractions of viewBox 340×540 */
  dotFx: number;
  dotFy: number;
}

/* ─── palette (hex only — CSS vars don't work in SVG fill attr) */
const C = {
  skin:       "#e8b896",
  skinDark:   "#d4966e",
  skinShad:   "#c4845c",
  hairM:      "#3d2b1f",   // dark brown — male
  hairF:      "#2c1a0e",   // deep brown — female braid
  shirtM:     "#3b82f6",   // blue vest
  shirtF:     "#ec4899",   // pink top
  shorts:     "#1e3a5f",   // navy shorts (male)
  leggings:   "#7c3aed",   // purple leggings (female)
  shoe:       "#374151",
  shoeSole:   "#f9fafb",
  white:      "#ffffff",
  bg:         "#f0f4ff",   // light blue-white card background
  bgInner:    "#e8edf8",
  accent:     "#10b981",   // green  — leher
  amber:      "#f59e0b",   // amber  — pinggang
  blue:       "#6366f1",   // indigo — pinggul
  txtDark:    "#111827",
  txtMid:     "#374151",
  txtLight:   "#6b7280",
  border:     "#e5e7eb",
  markerBg:   "#ffffff",
};

/* ─── SVG viewBox dimensions ─────────────────────────────── */
const VW = 400;
const VH = 560;
const CX = 200;  // horizontal centre

/* ─────────────────────────────────────────────────────────
   MALE body illustration
   Full-body front-facing: head, neck, shoulders, chest,
   waist, hips, thighs, calves, feet.  Arms slightly away
   from torso. Clothing: blue vest, navy shorts, dark shoes.
───────────────────────────────────────────────────────── */
function MaleBody({ activeKey }: { activeKey: MeasurementKey | null }) {
  const hlLeher    = activeKey === "leher";
  const hlPinggang = activeKey === "pinggang";
  const hlPinggul  = activeKey === "pinggul";

  return (
    <g>
      {/* ── Shoes ── */}
      <ellipse cx={179} cy={527} rx={22} ry={9} fill={C.shoe} />
      <ellipse cx={221} cy={527} rx={22} ry={9} fill={C.shoe} />
      <ellipse cx={179} cy={524} rx={22} ry={8} fill="#4b5563" />
      <ellipse cx={221} cy={524} rx={22} ry={8} fill="#4b5563" />
      <rect x={158} y={516} width={42} height={9} rx={4} fill={C.shoe} />
      <rect x={200} y={516} width={42} height={9} rx={4} fill={C.shoe} />
      <rect x={158} y={513} width={42} height={6} rx={3} fill={C.shoeSole} />
      <rect x={200} y={513} width={42} height={6} rx={3} fill={C.shoeSole} />

      {/* ── Lower legs (calves) ── */}
      <path d="M 167,432 Q 160,470 159,510 L 200,510 Q 198,470 193,432 Z" fill={C.skin} />
      <path d="M 233,432 Q 240,470 241,510 L 200,510 Q 202,470 207,432 Z" fill={C.skin} />
      {/* calf shadow */}
      <path d="M 170,432 Q 164,465 162,505 L 168,505 Q 167,465 173,432 Z" fill={C.skinShad} opacity={0.35} />
      <path d="M 230,432 Q 236,465 238,505 L 232,505 Q 231,465 227,432 Z" fill={C.skinShad} opacity={0.35} />

      {/* ── Knees ── */}
      <ellipse cx={180} cy={432} rx={14} ry={10} fill={C.skin} />
      <ellipse cx={220} cy={432} rx={14} ry={10} fill={C.skin} />
      <ellipse cx={180} cy={432} rx={10} ry={7} fill={C.skinDark} opacity={0.25} />
      <ellipse cx={220} cy={432} rx={10} ry={7} fill={C.skinDark} opacity={0.25} />

      {/* ── Thighs (under shorts) ── */}
      <path d={`M 163,${hlPinggul ? 308 : 310} Q 155,360 163,432 L 198,432 Q 194,368 188,${hlPinggul ? 308 : 310} Z`}
        fill={C.skin} />
      <path d={`M 237,${hlPinggul ? 308 : 310} Q 245,360 237,432 L 202,432 Q 206,368 212,${hlPinggul ? 308 : 310} Z`}
        fill={C.skin} />

      {/* ── Shorts ── */}
      <path
        d={`M 155,${hlPinggul ? 288 : 290} Q 150,310 163,330 L 198,332 L 200,${hlPinggul ? 288 : 290} Z`}
        fill={hlPinggul ? "#2563eb" : C.shorts}
      />
      <path
        d={`M 245,${hlPinggul ? 288 : 290} Q 250,310 237,330 L 202,332 L 200,${hlPinggul ? 288 : 290} Z`}
        fill={hlPinggul ? "#2563eb" : C.shorts}
      />
      <rect
        x={150} y={hlPinggul ? 278 : 280} width={100} height={16} rx={4}
        fill={hlPinggul ? "#2563eb" : "#264775"}
      />

      {/* ── Arms (forearms + hands) ── */}
      {/* left arm */}
      <path d="M 132,190 Q 120,225 118,270 Q 117,282 124,286 L 138,286 Q 142,270 140,235 L 148,190 Z"
        fill={C.skin} />
      {/* right arm */}
      <path d="M 268,190 Q 280,225 282,270 Q 283,282 276,286 L 262,286 Q 258,270 260,235 L 252,190 Z"
        fill={C.skin} />
      {/* hands */}
      <ellipse cx={129} cy={290} rx={11} ry={9} fill={C.skin} />
      <ellipse cx={271} cy={290} rx={11} ry={9} fill={C.skin} />
      {/* fingers hint */}
      <path d="M 120,287 Q 118,296 122,298 Q 124,300 126,297" fill="none" stroke={C.skinDark} strokeWidth="1" opacity="0.5" />
      <path d="M 280,287 Q 282,296 278,298 Q 276,300 274,297" fill="none" stroke={C.skinDark} strokeWidth="1" opacity="0.5" />

      {/* ── Shirt / vest ── */}
      {/* body of shirt */}
      <path
        d={`
          M 148,148 Q 140,152 136,165 L 132,190 L 148,190
          L 148,${hlPinggang ? 278 : 280}
          L 252,${hlPinggang ? 278 : 280}
          L 252,190 L 268,190 L 264,165 Q 260,152 252,148
          Q 235,138 200,138 Q 165,138 148,148 Z
        `}
        fill={hlPinggang ? "#2563eb" : C.shirtM}
      />
      {/* shirt collar area */}
      <path d="M 185,138 Q 188,148 200,152 Q 212,148 215,138 Q 208,142 200,142 Q 192,142 185,138 Z"
        fill={hlPinggang ? "#1d4ed8" : "#2563eb"} opacity={0.7} />
      {/* shirt shadow */}
      <path d="M 148,148 Q 140,152 136,165 L 132,190 L 140,190 L 144,165 Q 148,155 155,150 Z"
        fill="#000" opacity={0.07} />
      <path d="M 252,148 Q 260,152 264,165 L 268,190 L 260,190 L 256,165 Q 252,155 245,150 Z"
        fill="#000" opacity={0.07} />
      {/* waist highlight ring */}
      {hlPinggang && (
        <rect x={148} y={270} width={104} height={8} rx={2} fill="#60a5fa" opacity={0.5} />
      )}

      {/* ── Neck ── */}
      <rect
        x={190} y={118} width={20} height={26} rx={6}
        fill={hlLeher ? "#d97706" : C.skin}
        stroke={hlLeher ? C.amber : "none"}
        strokeWidth={hlLeher ? 2 : 0}
      />
      {hlLeher && (
        <rect x={184} y={118} width={32} height={4} rx={2} fill={C.amber} opacity={0.6} />
      )}

      {/* ── Head ── */}
      {/* skull */}
      <ellipse cx={CX} cy={86} rx={34} ry={38} fill={C.skin} />
      {/* jaw / chin */}
      <path d="M 172,96 Q 172,118 180,124 Q 190,132 200,133 Q 210,132 220,124 Q 228,118 228,96"
        fill={C.skin} />
      {/* ear */}
      <ellipse cx={166} cy={90} rx={6} ry={8} fill={C.skinDark} />
      <ellipse cx={234} cy={90} rx={6} ry={8} fill={C.skinDark} />
      {/* hair — short dark */}
      <path d="M 168,68 Q 170,48 200,46 Q 230,48 232,68 Q 228,58 200,56 Q 172,58 168,68 Z"
        fill={C.hairM} />
      <path d="M 168,68 Q 166,80 168,88 Q 170,72 173,66 Z" fill={C.hairM} />
      <path d="M 232,68 Q 234,80 232,88 Q 230,72 227,66 Z" fill={C.hairM} />
      {/* eyebrows */}
      <path d="M 184,78 Q 190,75 196,77" fill="none" stroke={C.hairM} strokeWidth="2" strokeLinecap="round" />
      <path d="M 204,77 Q 210,75 216,78" fill="none" stroke={C.hairM} strokeWidth="2" strokeLinecap="round" />
      {/* eyes */}
      <ellipse cx={190} cy={84} rx={5} ry={5} fill={C.white} />
      <ellipse cx={210} cy={84} rx={5} ry={5} fill={C.white} />
      <circle cx={190} cy={84} r={3} fill="#3d2b1f" />
      <circle cx={210} cy={84} r={3} fill="#3d2b1f" />
      <circle cx={191} cy={83} r={1} fill={C.white} />
      <circle cx={211} cy={83} r={1} fill={C.white} />
      {/* nose */}
      <path d="M 198,90 Q 196,96 198,98 Q 200,100 202,98 Q 204,96 202,90" fill="none"
        stroke={C.skinShad} strokeWidth="1.2" strokeLinecap="round" />
      {/* mouth */}
      <path d="M 194,106 Q 200,110 206,106" fill="none"
        stroke={C.skinShad} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
}

/* ─────────────────────────────────────────────────────────
   FEMALE body illustration
   Same pose; adjusted proportions (wider hips, narrower
   waist, longer hair braid).  Clothing: pink top, purple
   leggings, dark shoes. Single long braid down the back.
───────────────────────────────────────────────────────── */
function FemaleBody({ activeKey }: { activeKey: MeasurementKey | null }) {
  const hlLeher    = activeKey === "leher";
  const hlPinggang = activeKey === "pinggang";
  const hlPinggul  = activeKey === "pinggul";

  return (
    <g>
      {/* ── Shoes ── */}
      <ellipse cx={180} cy={527} rx={21} ry={8} fill={C.shoe} />
      <ellipse cx={220} cy={527} rx={21} ry={8} fill={C.shoe} />
      <ellipse cx={180} cy={524} rx={21} ry={7} fill="#4b5563" />
      <ellipse cx={220} cy={524} rx={21} ry={7} fill="#4b5563" />
      <rect x={160} y={517} width={40} height={8} rx={4} fill={C.shoe} />
      <rect x={200} y={517} width={40} height={8} rx={4} fill={C.shoe} />

      {/* ── Leggings / lower legs ── */}
      <path d={`M 170,${hlPinggul ? 308 : 310} Q 162,380 161,520 L 200,520 Q 198,380 192,${hlPinggul ? 308 : 310} Z`}
        fill={hlPinggul ? "#7c3aed" : C.leggings} />
      <path d={`M 230,${hlPinggul ? 308 : 310} Q 238,380 239,520 L 200,520 Q 202,380 208,${hlPinggul ? 308 : 310} Z`}
        fill={hlPinggul ? "#7c3aed" : C.leggings} />
      {/* legging sheen */}
      <path d={`M 173,${hlPinggul ? 308 : 310} Q 166,370 164,515 L 170,515 Q 169,370 176,${hlPinggul ? 308 : 310} Z`}
        fill={C.white} opacity={0.12} />
      <path d={`M 227,${hlPinggul ? 308 : 310} Q 234,370 236,515 L 230,515 Q 229,370 224,${hlPinggul ? 308 : 310} Z`}
        fill={C.white} opacity={0.12} />

      {/* ── Hips panel ── */}
      <path
        d={`M 152,${hlPinggul ? 274 : 276} Q 148,292 160,308 Q 172,318 200,320 Q 228,318 240,308 Q 252,292 248,${hlPinggul ? 274 : 276} Z`}
        fill={hlPinggul ? "#7c3aed" : C.leggings}
      />
      {hlPinggul && (
        <path d={`M 152,270 Q 148,276 155,280 L 245,280 Q 252,276 248,270 Z`}
          fill="#a78bfa" opacity={0.5} />
      )}

      {/* ── Arms ── */}
      {/* left arm */}
      <path d="M 138,172 Q 126,212 124,256 Q 123,268 130,272 L 144,272 Q 147,256 144,218 L 152,172 Z"
        fill={C.skin} />
      {/* right arm */}
      <path d="M 262,172 Q 274,212 276,256 Q 277,268 270,272 L 256,272 Q 253,256 256,218 L 248,172 Z"
        fill={C.skin} />
      {/* hands */}
      <ellipse cx={135} cy={276} rx={10} ry={8} fill={C.skin} />
      <ellipse cx={265} cy={276} rx={10} ry={8} fill={C.skin} />

      {/* ── Top / shirt ── */}
      <path
        d={`
          M 152,150 Q 142,155 138,172 L 152,172
          L 152,${hlPinggang ? 274 : 276}
          L 248,${hlPinggang ? 274 : 276}
          L 248,172 L 262,172 L 258,155 Q 250,148 200,142 Q 155,144 152,150 Z
        `}
        fill={hlPinggang ? "#db2777" : C.shirtF}
      />
      {/* neckline V */}
      <path d="M 186,142 Q 196,158 200,162 Q 204,158 214,142"
        fill={hlPinggang ? "#be185d" : "#be185d"} opacity={0.6} />
      {/* shirt shadow */}
      <path d="M 152,150 Q 142,155 138,172 L 145,172 L 148,158 Q 152,152 158,150 Z"
        fill="#000" opacity={0.06} />
      {hlPinggang && (
        <rect x={152} y={265} width={96} height={7} rx={2} fill="#f472b6" opacity={0.55} />
      )}

      {/* ── Neck ── */}
      <rect
        x={191} y={120} width={18} height={26} rx={5}
        fill={hlLeher ? "#d97706" : C.skin}
        stroke={hlLeher ? C.amber : "none"}
        strokeWidth={hlLeher ? 2 : 0}
      />
      {hlLeher && (
        <rect x={185} y={120} width={30} height={4} rx={2} fill={C.amber} opacity={0.6} />
      )}

      {/* ── Head ── */}
      <ellipse cx={CX} cy={88} rx={32} ry={36} fill={C.skin} />
      <path d="M 174,98 Q 174,120 182,126 Q 191,134 200,135 Q 209,134 218,126 Q 226,120 226,98"
        fill={C.skin} />
      {/* ears */}
      <ellipse cx={168} cy={92} rx={5.5} ry={7} fill={C.skinDark} />
      <ellipse cx={232} cy={92} rx={5.5} ry={7} fill={C.skinDark} />
      {/* Hair top */}
      <path d="M 170,72 Q 172,50 200,48 Q 228,50 230,72 Q 224,60 200,58 Q 176,60 170,72 Z"
        fill={C.hairF} />
      <path d="M 170,72 Q 166,82 168,96 Q 168,84 172,76 Z" fill={C.hairF} />
      <path d="M 230,72 Q 234,82 232,96 Q 232,84 228,76 Z" fill={C.hairF} />
      {/* side hair framing face */}
      <path d="M 170,72 Q 166,90 170,110 Q 172,120 174,126 Q 170,114 169,96 Q 167,84 170,72 Z"
        fill={C.hairF} />
      <path d="M 230,72 Q 234,90 230,110 Q 228,120 226,126 Q 230,114 231,96 Q 233,84 230,72 Z"
        fill={C.hairF} />

      {/* ── Long braid down centre-back (rendered at lower z so shirt covers front) ── */}
      {/* We render the braid segments behind the figure as a decorative tail */}
      <g opacity={0.9}>
        {/* braid root */}
        <path d="M 194,130 Q 200,134 206,130 Q 204,140 200,144 Q 196,140 194,130 Z" fill={C.hairF} />
        {/* braid segments — a series of connected diamonds */}
        {[0,1,2,3,4,5,6,7,8].map((i) => {
          const baseY = 144 + i * 22;
          const w = Math.max(4, 9 - i * 0.4);
          return (
            <g key={i}>
              <path
                d={`M ${CX - w},${baseY + 2} Q ${CX},${baseY} ${CX + w},${baseY + 2}
                    Q ${CX + w + 2},${baseY + 11} ${CX},${baseY + 20}
                    Q ${CX - w - 2},${baseY + 11} ${CX - w},${baseY + 2} Z`}
                fill={C.hairF}
              />
              {/* cross-hatch detail */}
              <line x1={CX - w} y1={baseY + 2} x2={CX + w + 2} y2={baseY + 11}
                stroke={C.hairM} strokeWidth="0.5" opacity="0.3" />
              <line x1={CX + w} y1={baseY + 2} x2={CX - w - 2} y2={baseY + 11}
                stroke={C.hairM} strokeWidth="0.5" opacity="0.3" />
            </g>
          );
        })}
        {/* braid tip */}
        <ellipse cx={CX} cy={342} rx={4} ry={7} fill={C.hairF} />
        {/* hair tie */}
        <rect x={CX - 5} y={337} width={10} height={4} rx={2} fill={C.amber} />
      </g>

      {/* eyebrows */}
      <path d="M 185,79 Q 190,76 196,78" fill="none" stroke={C.hairF} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 204,78 Q 210,76 215,79" fill="none" stroke={C.hairF} strokeWidth="1.8" strokeLinecap="round" />
      {/* eyes — slightly larger */}
      <ellipse cx={190} cy={86} rx={5.5} ry={5.5} fill={C.white} />
      <ellipse cx={210} cy={86} rx={5.5} ry={5.5} fill={C.white} />
      <circle cx={190} cy={86} r={3.5} fill="#5b3a29" />
      <circle cx={210} cy={86} r={3.5} fill="#5b3a29" />
      <circle cx={191} cy={85} r={1.2} fill={C.white} />
      <circle cx={211} cy={85} r={1.2} fill={C.white} />
      {/* lashes */}
      <path d="M 185,82 Q 186,80 188,81" fill="none" stroke={C.hairF} strokeWidth="1" strokeLinecap="round" />
      <path d="M 215,82 Q 214,80 212,81" fill="none" stroke={C.hairF} strokeWidth="1" strokeLinecap="round" />
      {/* nose */}
      <path d="M 198,92 Q 196,98 198,100 Q 200,102 202,100 Q 204,98 202,92"
        fill="none" stroke={C.skinShad} strokeWidth="1" strokeLinecap="round" />
      {/* lips */}
      <path d="M 192,109 Q 196,106 200,107 Q 204,106 208,109"
        fill="none" stroke="#c0645a" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 194,109 Q 200,113 206,109"
        fill="none" stroke="#c0645a" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  );
}

/* ─── Neutral silhouette (kelamin = null) ─────────────── */
function NeutralBody({ activeKey }: { activeKey: MeasurementKey | null }) {
  // Use male figure as neutral fallback
  return <MaleBody activeKey={activeKey} />;
}

/* ─── Interactive measurement marker ─────────────────── */
function Marker({
  x, y,
  color,
  isActive,
  onEnter,
  onLeave,
  onClick,
}: {
  x: number; y: number;
  color: string;
  isActive: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  return (
    <g
      style={{
        cursor: "pointer",
        /*
         * SVG `transform` on a <g> element uses SVG coordinate space, so we
         * apply the scale via a CSS transform with an explicit transform-origin
         * pointing at the marker centre (x, y) in px.  The transition gives
         * the smooth scale-up on hover / active state.
         */
        transform: isActive ? `scale(1.35)` : "scale(1)",
        transformOrigin: `${x}px ${y}px`,
        transition: "transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* outer glow ring — visible when active */}
      {isActive && (
        <>
          <circle cx={x} cy={y} r={20} fill={color} opacity={0.10} />
          <circle cx={x} cy={y} r={14} fill={color} opacity={0.18} />
        </>
      )}
      {/* border ring — always visible, thickens when active */}
      <circle
        cx={x} cy={y} r={9}
        fill={C.markerBg}
        stroke={color}
        strokeWidth={isActive ? 2.8 : 1.8}
        style={{ transition: "stroke-width 0.18s ease" }}
      />
      {/* inner dot */}
      <circle
        cx={x} cy={y} r={4.5}
        fill={color}
        opacity={isActive ? 1 : 0.7}
        style={{ transition: "opacity 0.18s ease" }}
      />
    </g>
  );
}

/* ─── Callout label ──────────────────────────────────── */
function CalloutLabel({
  side,
  label,
  value,
  unit,
  color,
  markerX,
  markerY,
  textX,
  textY,
  isActive,
}: {
  side: "left" | "right";
  label: string;
  value: number | null;
  unit: string;
  color: string;
  markerX: number;
  markerY: number;
  textX: number;
  textY: number;
  isActive: boolean;
}) {
  const ta = side === "left" ? "end" : "start";
  const boxW = 90;
  const boxH = 52;
  const boxX = side === "left" ? textX - boxW : textX;
  const boxY = textY - 14;

  // Leader line elbow point
  const elbowX = side === "left" ? textX : textX;
  const elbowY = markerY;

  return (
    <g>
      {/* leader line from marker to elbow, then to box */}
      <polyline
        points={`${markerX},${markerY} ${elbowX},${elbowY} ${textX + (side === "left" ? 0 : 0)},${textY + 10}`}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? 1.8 : 1.2}
        strokeDasharray={isActive ? "none" : "4 3"}
        opacity={isActive ? 0.9 : 0.5}
      />

      {/* label box */}
      <rect
        x={boxX} y={boxY} width={boxW} height={boxH} rx={8}
        fill={isActive ? color : C.markerBg}
        stroke={color}
        strokeWidth={isActive ? 0 : 1.2}
        style={{
          filter: isActive ? `drop-shadow(0 2px 8px ${color}66)` : "none",
          transition: "all 0.2s",
        }}
      />

      {/* label text */}
      <text
        x={side === "left" ? boxX + boxW / 2 : boxX + boxW / 2}
        y={boxY + 17}
        textAnchor="middle"
        fill={isActive ? C.white : C.txtLight}
        fontSize={9.5}
        fontFamily="'DM Sans', sans-serif"
        fontWeight={600}
        letterSpacing="0.08em"
        style={{ textTransform: "uppercase" } as React.CSSProperties}
      >
        {label}
      </text>

      {/* value */}
      <text
        x={side === "left" ? boxX + boxW / 2 : boxX + boxW / 2}
        y={boxY + 38}
        textAnchor="middle"
        fill={isActive ? C.white : color}
        fontSize={21}
        fontFamily="'Bebas Neue', sans-serif"
        letterSpacing="0.03em"
      >
        {value != null ? `${value}` : "—"}
      </text>

      {/* unit */}
      {value != null && (
        <text
          x={side === "left" ? boxX + boxW / 2 + String(value).length * 6.5 + 2 : boxX + boxW / 2 + String(value).length * 6.5 + 2}
          y={boxY + 38}
          textAnchor="start"
          fill={isActive ? "rgba(255,255,255,0.7)" : C.txtLight}
          fontSize={9}
          fontFamily="'DM Sans', sans-serif"
        >
          {unit}
        </text>
      )}
    </g>
  );
}

/* ─── main export ────────────────────────────────────── */
export default function BodyDiagram({ leher, pinggang, pinggul, bb, kelamin }: Props) {
  const [activeKey, setActiveKey] = useState<MeasurementKey | null>(null);

  const measurements: Measurement[] = [
    {
      key: "leher",    label: "Leher",    value: leher,    unit: "cm",
      color: C.accent, side: "left",
      dotFx: 200, dotFy: 128,
    },
    {
      key: "pinggang", label: "Pinggang", value: pinggang, unit: "cm",
      color: C.amber,  side: "right",
      dotFx: 248, dotFy: 255,
    },
    {
      key: "pinggul",  label: "Pinggul",  value: pinggul,  unit: "cm",
      color: C.blue,   side: "left",   // moved to left so it doesn't crowd the right callouts
      dotFx: 152, dotFy: 300,
    },
  ];

  // Text box positions: left or right of figure
  const textPositions: Record<MeasurementKey, { x: number; y: number }> = {
    leher:    { x: 100, y: 118 },   // left side — neck
    pinggang: { x: 305, y: 246 },   // right side — waist
    pinggul:  { x: 100, y: 293 },   // left side — hip (was x:0, now corrected)
  };

  function toggle(key: MeasurementKey) {
    setActiveKey((prev) => (prev === key ? null : key));
  }

  return (
    <div
      style={{
        background: "#f8faff",
        border: "1px solid #e2e8f0",
        borderRadius: 20,
        padding: "18px 16px 14px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 24px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: C.txtLight, margin: 0,
          }}>
            Pengukuran Tubuh
          </p>
          {kelamin && (
            <p style={{ fontSize: 11, color: C.txtMid, margin: "2px 0 0", fontWeight: 500 }}>
              {kelamin === "PRIA" ? "Laki-laki" : "Perempuan"}
            </p>
          )}
        </div>
        {bb != null && (
          <div style={{
            background: C.white, border: "1px solid #e5e7eb",
            borderRadius: 10, padding: "4px 12px",
            fontSize: 12, fontWeight: 700, color: C.txtDark,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            {bb} <span style={{ fontSize: 10, fontWeight: 500, color: C.txtLight }}>kg</span>
          </div>
        )}
      </div>

      {/* hint */}
      <p style={{
        fontSize: 10.5, color: C.txtLight, margin: "0 0 8px",
        textAlign: "center", letterSpacing: "0.01em",
      }}>
        Tap / hover marker untuk detail
      </p>

      {/* SVG */}
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        width="100%"
        style={{ display: "block", maxWidth: 400, margin: "0 auto" }}
        aria-label="Diagram pengukuran tubuh interaktif"
      >
        <defs>
          <radialGradient id="bgGrad" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f0f4ff" stopOpacity="0" />
          </radialGradient>
          <filter id="shadowSoft">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#6366f1" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* background */}
        <rect width={VW} height={VH} fill="#f0f4ff" rx={12} />
        <ellipse cx={CX} cy={VH * 0.45} rx={130} ry={200} fill="url(#bgGrad)" />

        {/* floor shadow */}
        <ellipse cx={CX} cy={540} rx={72} ry={12} fill="#c7d2e8" opacity={0.5} />

        {/* body figure */}
        <g filter="url(#shadowSoft)">
          {kelamin === "WANITA"
            ? <FemaleBody activeKey={activeKey} />
            : <MaleBody   activeKey={activeKey} />
          }
        </g>

        {/* measurement callout labels */}
        {measurements.map((m) => {
          const tp = textPositions[m.key];
          return (
            <CalloutLabel
              key={m.key}
              side={m.side}
              label={m.label}
              value={m.value}
              unit={m.unit}
              color={m.color}
              markerX={m.dotFx}
              markerY={m.dotFy}
              textX={tp.x}
              textY={tp.y}
              isActive={activeKey === m.key}
            />
          );
        })}

        {/* measurement markers — rendered last so they sit on top */}
        {measurements.map((m) => (
          <Marker
            key={m.key}
            x={m.dotFx}
            y={m.dotFy}
            color={m.color}
            isActive={activeKey === m.key}
            onEnter={() => setActiveKey(m.key)}
            onLeave={() => setActiveKey(null)}
            onClick={() => toggle(m.key)}
          />
        ))}
      </svg>

      {/* no-data nudge */}
      {leher == null && pinggang == null && pinggul == null && (
        <p style={{
          fontSize: 11.5, color: C.txtLight,
          textAlign: "center", marginTop: 8,
        }}>
          Log lingkar tubuh untuk mengisi diagram ini.
        </p>
      )}
    </div>
  );
}
