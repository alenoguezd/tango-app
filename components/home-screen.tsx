"use client";

import { Upload, ArrowRight, FolderOpen, Play } from "lucide-react";
import { type VocabCard } from "@/components/flashcard";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DeckSet {
  id: string;
  title: string;
  cardCount: number;
  progress: number;   // 0–100
  lastStudied: string;
  cards: VocabCard[];
  color?: "blue" | "pink";
}

interface HomeScreenProps {
  sets: DeckSet[];
  recent?: DeckSet | null;
  onContinue: (set: DeckSet) => void;
  onStudy: (set: DeckSet) => void;
  onGoCrear?: () => void;
  onGoProgreso?: () => void;
}

// ── Design tokens — exact Figma values ────────────────────────────────────────
const W           = "#FFFFFF";
const BG_PAGE     = "#FFFFFF";
const FONT        = "var(--font-sans)";          // Roboto

// Text
const TEXT_PRI    = "#111111";
const TEXT_SEC    = "#555555";
const TEXT_MUT    = "#9A9A9A";

// Accent (Continuar / Todos links)
const LINK_BLUE   = "#1565C0";

// Banner
const BANNER_BG   = "#EBF0F8";

// Recientes card
const CARD_BORDER = "#E0E0E0";

// Folder card colours
const BLUE_CARD   = "#E7EEF6";   // spec: #E7EEF6
const BLUE_TAB    = "#D4E2F1";   // spec: #D4E2F1
const PINK_CARD   = "#FFE1EB";   // spec: #FFE1EB
const PINK_TAB    = "#F7CDDB";   // spec: #F7CDDB

// Progress bar
const PROG_FG     = "#1565C0";
const PROG_TRACK  = "#D1D5DB";

// Nav
const NAV_PILL    = "#EBEBEB";

// Exact Figma dimensions
const CARD_H      = 138.5;       // px
const TAB_W       = 81.189;      // px
const TAB_H       = 18.471;      // px
const CARD_RADIUS = 10;          // px
const CARD_PAD_X  = 10;          // px
const ROW_GAP     = 16;          // px between grid rows
const COL_GAP     = 12;          // px between columns
const H_PAD       = 16;          // px page horizontal padding
const SECTION_GAP = 24;          // px between sections

// ── HomeScreen ────────────────────────────────────────────────────────────────
export function HomeScreen({ sets, recent, onContinue, onStudy, onGoCrear, onGoProgreso }: HomeScreenProps) {
  const recentItem = recent ?? sets[0] ?? null;

  return (
    <div style={{
      height: "100dvh",
      width: "100%",
      maxWidth: "375px",
      margin: "0 auto",
      background: BG_PAGE,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Safe-area top spacer */}
      <div aria-hidden style={{
        flexShrink: 0,
        height: "max(16px, env(safe-area-inset-top, 0px))",
        background: BG_PAGE,
      }} />

      {/* ── Scrollable body ── */}
      <div className="scroll-area" style={{ flex: 1, minHeight: 0 }}>
        <div style={{ padding: `0 ${H_PAD}px` }}>

          {/* ── Title ── */}
          <h1 style={{
            fontFamily: FONT,
            fontSize: "36px",
            fontWeight: 500,
            color: "#1D1B20",
            letterSpacing: "0",
            lineHeight: "44px",
            margin: `8px 0 ${SECTION_GAP}px`,
          }}>
            Explorar
          </h1>

          {/* ── Upload banner ── */}
          <div style={{
            background: BANNER_BG,
            borderRadius: "14px",
            padding: "18px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: `${SECTION_GAP}px`,
          }}>
            <p style={{
              fontFamily: FONT,
              fontSize: "15px",
              fontWeight: 400,
              color: TEXT_PRI,
              lineHeight: 1.4,
              flex: 1,
              margin: 0,
            }}>
              Sube una imagen para crear un set
            </p>
            <Upload
              aria-hidden
              style={{
                flexShrink: 0,
                width: "22px",
                height: "22px",
                color: TEXT_PRI,
                strokeWidth: 1.8,
              }}
            />
          </div>

          {/* ── Recientes section ── */}
          <h2 style={{
            fontFamily: FONT,
            fontSize: "20px",
            fontWeight: 500,
            color: "#1D1B20",
            letterSpacing: "0",
            lineHeight: "28px",
            margin: `0 0 14px`,
          }}>
            Recientes
          </h2>

          {recentItem ? (
            <button
              onClick={() => onContinue(recentItem)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: W,
                border: `1px solid ${CARD_BORDER}`,
                borderRadius: "16px",
                padding: "18px 18px 16px",
                cursor: "pointer",
                marginBottom: `${SECTION_GAP}px`,
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}>
                <span style={{
                  fontFamily: FONT,
                  fontSize: "20px",
                  fontWeight: 500,
                  color: "#1D1B20",
                  letterSpacing: "0",
                  lineHeight: "28px",
                }}>
                  {recentItem.title}
                </span>
                <span style={{
                  fontFamily: FONT,
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#016D9E",
                  letterSpacing: "0.1px",
                  lineHeight: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                }}>
                  Continuar
                  <ArrowRight style={{ width: "14px", height: "14px", strokeWidth: 2.5 }} />
                </span>
              </div>
              <p style={{
                fontFamily: FONT,
                fontSize: "13px",
                color: TEXT_SEC,
                margin: "0 0 10px",
              }}>
                {recentItem.cardCount} Tarjetas
              </p>
              <ProgressBar value={recentItem.progress} showDot />
            </button>
          ) : (
            <div style={{
              borderRadius: "16px",
              border: `1.5px dashed ${CARD_BORDER}`,
              color: TEXT_MUT,
              fontFamily: FONT,
              fontSize: "14px",
              padding: "28px",
              textAlign: "center",
              marginBottom: `${SECTION_GAP}px`,
            }}>
              Sin actividad reciente
            </div>
          )}

          {/* ── Sets header ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0",
          }}>
            <h2 style={{
              fontFamily: FONT,
              fontSize: "20px",
              fontWeight: 500,
              color: "#1D1B20",
              letterSpacing: "0",
              lineHeight: "28px",
              margin: 0,
            }}>
              Sets
            </h2>
            <button style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: FONT,
              fontSize: "15px",
              fontWeight: 500,
              color: LINK_BLUE,
              display: "flex",
              alignItems: "center",
              gap: "2px",
              padding: "4px 0",
              minHeight: "44px",
            }}>
              Todos
              <ArrowRight style={{ width: "15px", height: "15px", strokeWidth: 2.5 }} />
            </button>
          </div>

          {/* ── Sets grid ──
              paddingTop = TAB_H so the overflowing SVG tab has room */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: `${COL_GAP}px`,
            rowGap: `${ROW_GAP + TAB_H}px`,   // row gap + tab height so tabs don't overlap card below
            paddingTop: `${TAB_H + 4}px`,
            paddingBottom: "24px",
          }}>
            {sets.map((set, i) => (
              <SetCard
                key={set.id}
                set={set}
                color={set.color ?? (i % 2 === 0 ? "blue" : "pink")}
                onClick={() => onStudy(set)}
              />
            ))}
          </div>

        </div>
      </div>

      {/* ── Bottom navigation ── */}
      <nav
        aria-label="Navegación principal"
        style={{
          flexShrink: 0,
          width: "100%",
          background: W,
          borderTop: `1px solid #E8E8E8`,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-around",
          paddingTop: "10px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px) + 8px)",
        }}
      >
        <NavItem label="Home"    active       icon={<SmileIcon />} onClick={() => {}} />
        <NavItem label="Crear"   active={false} icon={<FolderOpen style={{ width: "22px", height: "22px", strokeWidth: 1.8 }} />} onClick={() => onGoCrear?.()} />
        <NavItem label="Progreso" active={false} icon={<Play style={{ width: "20px", height: "20px", strokeWidth: 1.8 }} />} onClick={() => onGoProgreso?.()} />
      </nav>

      {/* iOS home indicator */}
      <div aria-hidden style={{
        flexShrink: 0,
        background: W,
        display: "flex",
        justifyContent: "center",
        paddingTop: "4px",
        paddingBottom: "max(6px, env(safe-area-inset-bottom, 6px))",
      }}>
        <div style={{
          width: "134px",
          height: "5px",
          borderRadius: "99px",
          background: "#111",
        }} />
      </div>
    </div>
  );
}

// ── SetCard ───────────────────────────────────────────────────────────────────
function SetCard({
  set,
  color,
  onClick,
}: {
  set: DeckSet;
  color: "blue" | "pink";
  onClick: () => void;
}) {
  const cardBg = color === "blue" ? BLUE_CARD : PINK_CARD;
  const tabFill = color === "blue" ? BLUE_TAB  : PINK_TAB;

  return (
    <div style={{ position: "relative" }}>

      {/* Folder tab — SVG extended by CARD_RADIUS px downward so it
          overlaps the card's top-left corner, eliminating any gap.
          The card's borderTopLeftRadius is set to 0 to match. */}
      <div style={{
        position: "absolute",
        top: `-${TAB_H}px`,
        left: 0,
        width: `${TAB_W}px`,
        /* extend height into the card by CARD_RADIUS so there's no gap */
        height: `${TAB_H + CARD_RADIUS}px`,
        pointerEvents: "none",
        zIndex: 1,
      }}>
        <svg
          width={TAB_W}
          height={TAB_H + CARD_RADIUS}
          viewBox={`0 0 ${TAB_W} ${TAB_H + CARD_RADIUS}`}
          fill="none"
          aria-hidden
          style={{ display: "block" }}
        >
          {/* Curved tab shape */}
          <path
            d="M1.15795 9.17728C1.81115 3.93493 6.2668 0 11.5497 0H71.1852C75.5889 0 79.3026 3.28097 79.8454 7.65109L81.1892 18.4706H0L1.15795 9.17728Z"
            fill={tabFill}
          />
          {/* Filled rectangle below tab path — covers card's rounded top-left corner */}
          <rect
            x="0"
            y={TAB_H - 0.5}
            width={TAB_W}
            height={CARD_RADIUS + 1}
            fill={cardBg}
          />
        </svg>
        {/* Tab label — vertically centered within the tab shape height */}
        <span style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: `${TAB_H}px`,
          display: "flex",
          alignItems: "center",
          paddingLeft: "10px",
          fontFamily: FONT,
          fontSize: "11px",
          fontWeight: 500,
          color: TEXT_SEC,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {set.title}
        </span>
      </div>

      {/* Card body — top-left corner is flat (0) where tab connects */}
      <button
        onClick={onClick}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          width: "100%",
          height: `${CARD_H}px`,
          textAlign: "left",
          background: cardBg,
          border: "none",
          borderRadius: `0 ${CARD_RADIUS}px ${CARD_RADIUS}px ${CARD_RADIUS}px`,
          padding: `16px ${CARD_PAD_X}px 14px`,
          cursor: "pointer",
        }}
        aria-label={`Estudiar ${set.title}`}
      >
        <span style={{
          fontFamily: FONT,
          fontSize: "42px",
          fontWeight: 700,
          color: TEXT_PRI,
          lineHeight: 1,
          display: "block",
        }}>
          {set.cardCount}
        </span>
        <span style={{
          fontFamily: FONT,
          fontSize: "14px",
          fontWeight: 400,
          color: TEXT_SEC,
          display: "block",
          marginTop: "4px",
        }}>
          Tarjetas
        </span>
      </button>
    </div>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
function ProgressBar({ value, showDot = false }: { value: number; showDot?: boolean }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        position: "relative",
        width: "100%",
        height: "5px",
        borderRadius: "99px",
        background: PROG_TRACK,
      }}
    >
      <div style={{
        position: "absolute",
        left: 0, top: 0,
        height: "100%",
        width: `${pct}%`,
        borderRadius: "99px",
        background: PROG_FG,
      }} />
      {showDot && (
        <div style={{
          position: "absolute",
          right: "-3px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: PROG_TRACK,
          border: `1.5px solid ${PROG_TRACK}`,
        }} />
      )}
    </div>
  );
}

// ── NavItem ───────────────────────────────────────────────────────────────────
function NavItem({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "3px",
        minHeight: "48px",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}>
      <div style={{
        width: active ? "64px" : "44px",
        height: "32px",
        borderRadius: "16px",
        background: active ? NAV_PILL : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? TEXT_PRI : TEXT_MUT,
        transition: "width 0.15s ease, background 0.15s ease",
      }}>
        {icon}
      </div>
      <span style={{
        fontFamily: FONT,
        fontSize: "11px",
        fontWeight: active ? 700 : 400,
        color: active ? TEXT_PRI : TEXT_MUT,
      }}>
        {label}
      </span>
    </button>
  );
}

// ── SmileIcon ─────────────────────────────────────────────────────────────────
function SmileIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="6"
        stroke="currentColor" strokeWidth="1.9" />
      <circle cx="8.5" cy="10" r="1.25" fill="currentColor" />
      <circle cx="15.5" cy="10" r="1.25" fill="currentColor" />
      <path d="M8.5 14c1.2 1.6 5.8 1.6 7 0"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
