"use client";

import { useEffect, useState } from "react";
import { FolderOpen, Play, ChevronRight } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { tokens } from "@/lib/design-tokens";

// ── Design tokens ────────────────────────────────────────────────────────────
const W           = tokens.color.surface;
const BG_PAGE     = tokens.color.page;
const FONT        = "var(--font-sans)";

const TEXT_PRI    = tokens.color.ink;
const TEXT_SEC    = tokens.color.muted;
const TEXT_MUT    = tokens.color.muted;
const TEXT_RED    = tokens.color.rose;

const CARD_BORDER = tokens.color.border;
const PROG_FG     = tokens.color.sage;
const PROG_TRACK  = "#E8E8E8";
const NAV_PILL    = "#F0F0F0";
const BUTTER      = tokens.color.butter;
const SAGE        = tokens.color.sage;
const ROSE        = tokens.color.rose;

const ROW_GAP     = 16;
const COL_GAP     = 12;
const H_PAD       = 16;
const SECTION_GAP = 24;

// ── Types ─────────────────────────────────────────────────────────────────────
interface VocabCard {
  id?: string;
  kana: string;
  kanji: string;
  spanish: string;
  example_usage: string;
  known?: boolean;
}

interface DeckSet {
  id: string;
  title: string;
  cardCount: number;
  progress: number;
  lastStudied: string;
  cards: VocabCard[];
}

export interface SetProgress {
  id: string;
  title: string;
  cardCount: number;
  known: number;
  toReview: number;
  color?: "blue" | "pink";
}

interface ProgresoScreenProps {
  onNavigate: (tab: "inicio" | "crear" | "progreso") => void;
}

// ── useWindowSize Hook ────────────────────────────────────────────────────────
function useWindowSize() {
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Return desktop width (1024) during SSR/hydration, then switch to actual width
  return mounted ? windowWidth : 1024;
}

// ── ProgresoScreen ─────────────────────────────────────────────────────────────
export function ProgresoScreen({ onNavigate }: ProgresoScreenProps) {
  const [sets, setSets] = useState<SetProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 1024;

  useEffect(() => {
    // Load sets from localStorage and calculate progress
    const savedSets = localStorage.getItem("vocab_sets");
    if (savedSets) {
      try {
        const deckSets: DeckSet[] = JSON.parse(savedSets);
        const progressSets = deckSets.map((set, index) => {
          const known = set.cards.filter((card) => card.known === true).length;
          const toReview = set.cards.filter((card) => card.known === false).length;
          return {
            id: set.id,
            title: set.title,
            cardCount: set.cardCount,
            known,
            toReview,
            color: (index % 2 === 0 ? "blue" : "pink") as "blue" | "pink",
          };
        });
        setSets(progressSets);
      } catch (error) {
        console.error("Error loading sets from localStorage:", error);
        setSets([]);
      }
    }
    setLoading(false);
  }, []);

  const totalCards = sets.reduce((s, x) => s + x.cardCount, 0);
  const totalKnown = sets.reduce((s, x) => s + x.known, 0);
  const totalReview = sets.reduce((s, x) => s + x.toReview, 0);
  const overallPct = totalCards > 0 ? Math.round((totalKnown / totalCards) * 100) : 0;

  // Shared content component
  const ContentArea = () => {
    const badgeCount = sets.length;

    return (
      <>
        {/* Status bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              fontFamily: FONT,
              fontSize: "14px",
              fontWeight: 500,
              color: TEXT_PRI,
            }}
          >
            9:41
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: "3px",
                  height: "3px",
                  borderRadius: "50%",
                  background: TEXT_SEC,
                }}
              />
            ))}
          </div>
        </div>

        {/* Title with badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: `${SECTION_GAP}px`,
          }}
        >
          <h1
            style={{
              fontFamily: FONT,
              fontSize: "48px",
              fontWeight: 800,
              color: TEXT_PRI,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              margin: 0,
            }}
          >
            Progreso
          </h1>
          <div
            style={{
              background: BUTTER,
              borderRadius: "50px",
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: TEXT_PRI,
              }}
            >
              💡
            </span>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: TEXT_PRI,
              }}
            >
              {badgeCount}
            </span>
          </div>
        </div>

        {sets.length === 0 ? (
          /* ── Empty state ── */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: "80px",
              gap: "10px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: FONT,
                fontSize: "16px",
                fontWeight: 500,
                color: TEXT_PRI,
                margin: 0,
              }}
            >
              Aún no has estudiado ningún set
            </p>
            <p
              style={{
                fontFamily: FONT,
                fontSize: "14px",
                color: TEXT_MUT,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Empieza a estudiar para ver tu progreso aquí
            </p>
          </div>
        ) : (
          <>
            {/* ── Summary card ── */}
            <div
              style={{
                background: W,
                border: `1px solid ${CARD_BORDER}`,
                borderRadius: "14px",
                padding: "20px",
                marginBottom: `${SECTION_GAP}px`,
              }}
            >
              {/* Three stats in a single row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  marginBottom: "20px",
                }}
              >
                <StatCell label="dominadas" value={`${overallPct}%`} />
                <StatCell label="estudiadas" value={`${totalKnown}`} />
                <StatCell label="repasar" value={`${totalReview}`} color={TEXT_RED} />
              </div>

              {/* Overall progress bar with label */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <ProgressBar value={overallPct} />
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: "11px",
                    color: TEXT_SEC,
                    marginLeft: "8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {totalKnown}/{totalCards}
                </span>
              </div>
            </div>

            {/* ── Esta semana section ── */}
            <div
              style={{
                background: W,
                border: `1px solid ${CARD_BORDER}`,
                borderRadius: "14px",
                padding: "18px",
                marginBottom: `${SECTION_GAP}px`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    fontFamily: FONT,
                    fontSize: "18px",
                    fontWeight: 700,
                    color: TEXT_PRI,
                    margin: 0,
                  }}
                >
                  Esta semana
                </h3>
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: "14px",
                    fontWeight: 600,
                    color: SAGE,
                  }}
                >
                  +18% vs anterior
                </span>
              </div>
              <WeeklyChart />
            </div>

            {/* ── Por set section ── */}
            <h2
              style={{
                fontFamily: FONT,
                fontSize: "20px",
                fontWeight: 700,
                color: TEXT_PRI,
                margin: `0 0 16px`,
              }}
            >
              Por set
            </h2>

            {/* Set list — new card layout */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: ROW_GAP,
                paddingBottom: "24px",
              }}
            >
              {sets.map((set) => (
                <SetProgressCard key={set.id} set={set} color={set.color || "blue"} />
              ))}
            </div>
          </>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100dvh",
          background: BG_PAGE,
        }}
      >
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <>
      {/* ===== MOBILE LAYOUT (< 1024px) ===== */}
      {isMobile && (
        <div
          style={{
            height: "100dvh",
            maxWidth: "375px",
            margin: "0 auto",
            background: BG_PAGE,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Safe-area top spacer */}
          <div
            aria-hidden
            style={{
              flexShrink: 0,
              height: "max(16px, env(safe-area-inset-top, 0px))",
              background: BG_PAGE,
            }}
          />

          {/* ── Scrollable body ── */}
          <div style={{
            flex: 1,
            overflowY: 'scroll',
            WebkitOverflowScrolling: 'touch',
            height: '0',
            paddingBottom: "100px"
          }}>
            <div style={{ padding: `0 ${H_PAD}px` }}>
              <ContentArea />
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
            <NavItem
              label="Inicio"
              active={false}
              icon={<SmileIcon />}
              onClick={() => onNavigate("inicio")}
            />
            <NavItem
              label="Crear"
              active={false}
              icon={<FolderOpen style={{ width: "22px", height: "22px", strokeWidth: 1.8 }} />}
              onClick={() => onNavigate("crear")}
            />
            <NavItem
              label="Progreso"
              active
              icon={<Play style={{ width: "20px", height: "20px", strokeWidth: 1.8 }} />}
              onClick={() => {}}
            />
            <NavItem
              label="Perfil"
              active={false}
              icon={<PersonIcon />}
              onClick={() => onNavigate("perfil")}
            />
          </nav>

          {/* iOS home indicator */}
          <div
            aria-hidden
            style={{
              flexShrink: 0,
              background: W,
              display: "flex",
              justifyContent: "center",
              paddingTop: "4px",
              paddingBottom: "max(6px, env(safe-area-inset-bottom, 6px))",
            }}
          >
            <div
              style={{
                width: "134px",
                height: "5px",
                borderRadius: "99px",
                background: "#111",
              }}
            />
          </div>
        </div>
      )}

      {/* ===== DESKTOP LAYOUT (≥ 1024px) ===== */}
      {!isMobile && (
        <div
          style={{
            height: "100dvh",
            background: "#F7F6F3",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <AppSidebar activeTab="progreso" onNavigate={onNavigate} />

          {/* Main content area */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: "#F7F6F3",
            }}
          >
            {/* Safe-area top spacer */}
            <div
              aria-hidden
              style={{
                flexShrink: 0,
                height: "max(16px, env(safe-area-inset-top, 0px))",
              }}
            />

            {/* Scrollable content */}
            <div style={{
              flex: 1,
              overflowY: 'scroll',
              WebkitOverflowScrolling: 'touch',
              height: '100vh',
              paddingBottom: "40px"
            }}>
              <div
                style={{
                  maxWidth: "680px",
                  margin: "0 auto",
                  padding: `0 ${H_PAD}px`,
                  width: "100%",
                }}
              >
                <ContentArea />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── SetProgressCard — new flat layout with badge and arrow ────────────
function SetProgressCard({
  set,
  color,
}: {
  set: SetProgress;
  color: "blue" | "pink";
}) {
  const pct = set.cardCount > 0 ? Math.round((set.known / set.cardCount) * 100) : 0;
  const badgeBg = color === "blue" ? "#E0F2E0" : "#FFE5F0";
  const arrowBg = color === "blue" ? "#E0F2E0" : "#FFE5F0";
  const arrowColor = color === "blue" ? SAGE : ROSE;

  return (
    <div
      style={{
        background: W,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: "14px",
        padding: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
      }}
    >
      {/* Left: title + subtitle */}
      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontFamily: FONT,
            fontSize: "16px",
            fontWeight: 700,
            color: TEXT_PRI,
            margin: "0 0 4px",
          }}
        >
          {set.title}
        </h3>
        <p
          style={{
            fontFamily: FONT,
            fontSize: "12px",
            color: TEXT_SEC,
            margin: 0,
          }}
        >
          {set.known}/{set.cardCount} dominadas
        </p>
      </div>

      {/* Center: percentage badge */}
      <div
        style={{
          background: badgeBg,
          borderRadius: "20px",
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: FONT,
            fontSize: "14px",
            fontWeight: 700,
            color: arrowColor,
          }}
        >
          {pct}%
        </span>
      </div>

      {/* Right: arrow button */}
      <button
        style={{
          background: arrowBg,
          border: "none",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: arrowColor,
          flexShrink: 0,
        }}
      >
        <ChevronRight size={20} strokeWidth={2} />
      </button>
    </div>
  );
}

// ── StatCell ──────────────────────────────────────────────────────────────────
function StatCell({
  label,
  value,
  color = TEXT_PRI,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <span
        style={{
          fontFamily: FONT,
          fontSize: "36px",
          fontWeight: 800,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: FONT,
          fontSize: "11px",
          fontWeight: 400,
          color: TEXT_SEC,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── WeeklyChart ───────────────────────────────────────────────────────────────
function WeeklyChart() {
  // Mock data for weekly progress — days L, M, X, J, V, S, D
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  const heights = [40, 60, 30, 70, 80, 20, 95]; // percentage of max height

  const maxHeight = 100;
  const barHeight = 80; // visual max height in px

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "8px",
        height: `${barHeight + 20}px`,
      }}
    >
      {days.map((day, i) => {
        const isToday = i === days.length - 1;
        const barColor = isToday ? TEXT_PRI : SAGE;
        const actualHeight = (heights[i] / maxHeight) * barHeight;

        return (
          <div
            key={day}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <div
              style={{
                width: "100%",
                height: `${actualHeight}px`,
                background: barColor,
                borderRadius: "4px 4px 0 0",
              }}
            />
            <span
              style={{
                fontFamily: FONT,
                fontSize: "11px",
                fontWeight: 500,
                color: TEXT_SEC,
              }}
            >
              {day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
function ProgressBar({
  value,
  showDot = false,
}: {
  value: number;
  showDot?: boolean;
}) {
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
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${pct}%`,
          borderRadius: "99px",
          background: PROG_FG,
        }}
      />
      {showDot && (
        <div
          style={{
            position: "absolute",
            right: "-3px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: PROG_TRACK,
            border: `1.5px solid ${PROG_TRACK}`,
          }}
        />
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
      }}
    >
      <div
        style={{
          width: active ? "64px" : "44px",
          height: "32px",
          borderRadius: "12px",
          background: active ? NAV_PILL : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: active ? TEXT_PRI : TEXT_MUT,
          transition: "width 0.15s ease, background 0.15s ease",
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontFamily: FONT,
          fontSize: "11px",
          fontWeight: active ? 700 : 400,
          color: active ? TEXT_PRI : TEXT_MUT,
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ── SmileIcon ─────────────────────────────────────────────────────────────────
function SmileIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="8.5" cy="10" r="1.25" fill="currentColor" />
      <circle cx="15.5" cy="10" r="1.25" fill="currentColor" />
      <path
        d="M8.5 14c1.2 1.6 5.8 1.6 7 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 20c0-4.418 4.03-8 9-8s9 3.582 9 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
