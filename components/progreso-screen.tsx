"use client";

import { useEffect, useState } from "react";
import { FolderOpen, Play } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";

// ── Design tokens — identical to home-screen.tsx ──────────────────────────────
const W           = "#FFFFFF";
const BG_PAGE     = "#FFFFFF";
const FONT        = "var(--font-sans)";

const TEXT_PRI    = "#111111";
const TEXT_SEC    = "#555555";
const TEXT_MUT    = "#9A9A9A";
const TEXT_RED    = "#D0312D";

const CARD_BORDER = "#E0E0E0";
const PROG_FG     = "#1565C0";
const PROG_TRACK  = "#D1D5DB";
const NAV_PILL    = "#EBEBEB";

const BLUE_CARD   = "#E7EEF6";
const BLUE_TAB    = "#D4E2F1";
const PINK_CARD   = "#FFE1EB";
const PINK_TAB    = "#F7CDDB";

const CARD_H      = 138.5;
const TAB_W       = 81.189;
const TAB_H       = 18.471;
const CARD_RADIUS = 10;
const CARD_PAD_X  = 10;
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
  const [windowWidth, setWindowWidth] = useState<number>(1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowWidth;
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
  const ContentArea = () => (
    <>
      {/* Title */}
      <h1
        style={{
          fontFamily: FONT,
          fontSize: "36px",
          fontWeight: 500,
          color: "#1D1B20",
          letterSpacing: "0",
          lineHeight: "44px",
          margin: `8px 0 ${SECTION_GAP}px`,
        }}
      >
        Progreso
      </h1>

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
              borderRadius: "16px",
              padding: "18px 18px 16px",
              marginBottom: `${SECTION_GAP}px`,
            }}
          >
            {/* Three stats */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <StatCell label="conocidas" value={`${overallPct}%`} />
              <StatDivider />
              <StatCell label="estudiadas" value={`${totalKnown}`} />
              <StatDivider />
              <StatCell label="repasar" value={`${totalReview}`} color={TEXT_RED} />
            </div>

            {/* Overall progress bar */}
            <ProgressBar value={overallPct} showDot />
          </div>

          {/* ── Por set section ── */}
          <h2
            style={{
              fontFamily: FONT,
              fontSize: "20px",
              fontWeight: 500,
              color: "#1D1B20",
              letterSpacing: "0",
              lineHeight: "28px",
              margin: `0 0 ${TAB_H + 4}px`,
            }}
          >
            Por set
          </h2>

          {/* Set list — folder-style cards matching SetCard in home-screen */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              columnGap: `${COL_GAP}px`,
              rowGap: `${ROW_GAP + TAB_H}px`,
              paddingTop: `${TAB_H + 4}px`,
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
            overflow: "hidden",
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
          <div className="scroll-area" style={{ flex: 1, minHeight: 0 }}>
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
            overflow: "hidden",
          }}
        >
          <AppSidebar activeTab="progreso" onNavigate={onNavigate} />

          {/* Main content area */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
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
            <div className="scroll-area" style={{ flex: 1, minHeight: 0 }}>
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

// ── SetProgressCard — folder-style, mirrors SetCard in home-screen ────────────
function SetProgressCard({
  set,
  color,
}: {
  set: SetProgress;
  color: "blue" | "pink";
}) {
  const cardBg = color === "blue" ? BLUE_CARD : PINK_CARD;
  const tabFill = color === "blue" ? BLUE_TAB : PINK_TAB;
  const pct = set.cardCount > 0 ? Math.round((set.known / set.cardCount) * 100) : 0;

  return (
    <div style={{ position: "relative" }}>
      {/* Folder tab — same SVG pattern as home-screen SetCard */}
      <div
        style={{
          position: "absolute",
          top: `-${TAB_H}px`,
          left: 0,
          width: `${TAB_W}px`,
          height: `${TAB_H + CARD_RADIUS}px`,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <svg
          width={TAB_W}
          height={TAB_H + CARD_RADIUS}
          viewBox={`0 0 ${TAB_W} ${TAB_H + CARD_RADIUS}`}
          fill="none"
          aria-hidden
          style={{ display: "block" }}
        >
          <path
            d="M1.15795 9.17728C1.81115 3.93493 6.2668 0 11.5497 0H71.1852C75.5889 0 79.3026 3.28097 79.8454 7.65109L81.1892 18.4706H0L1.15795 9.17728Z"
            fill={tabFill}
          />
          <rect
            x="0"
            y={TAB_H - 0.5}
            width={TAB_W}
            height={CARD_RADIUS + 1}
            fill={cardBg}
          />
        </svg>
        <span
          style={{
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
          }}
        >
          {set.title}
        </span>
      </div>

      {/* Card body */}
      <div
        style={{
          width: "100%",
          height: `${CARD_H}px`,
          background: cardBg,
          borderRadius: `0 ${CARD_RADIUS}px ${CARD_RADIUS}px ${CARD_RADIUS}px`,
          padding: `14px ${CARD_PAD_X}px 12px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        {/* Top: big percentage */}
        <div>
          <span
            style={{
              fontFamily: FONT,
              fontSize: "38px",
              fontWeight: 700,
              color: TEXT_PRI,
              lineHeight: 1,
              display: "block",
            }}
          >
            {pct}%
          </span>
          <span
            style={{
              fontFamily: FONT,
              fontSize: "12px",
              fontWeight: 400,
              color: TEXT_SEC,
              display: "block",
              marginTop: "2px",
            }}
          >
            conocidas
          </span>
        </div>

        {/* Bottom: sub-stats + progress bar */}
        <div>
          <p
            style={{
              fontFamily: FONT,
              fontSize: "11px",
              color: TEXT_MUT,
              margin: "0 0 6px",
              lineHeight: 1.3,
            }}
          >
            {set.known} conocidas · {set.toReview} repasar
          </p>
          <ProgressBar value={pct} />
        </div>
      </div>
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
        gap: "2px",
      }}
    >
      <span
        style={{
          fontFamily: FONT,
          fontSize: "28px",
          fontWeight: 700,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: FONT,
          fontSize: "12px",
          fontWeight: 400,
          color: TEXT_SEC,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── StatDivider ───────────────────────────────────────────────────────────────
function StatDivider() {
  return (
    <div
      style={{
        width: "1px",
        alignSelf: "stretch",
        background: CARD_BORDER,
        margin: "0 4px",
        flexShrink: 0,
      }}
    />
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
          borderRadius: "16px",
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
