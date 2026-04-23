"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { tokens } from "@/lib/design-tokens";
import { PageTitle } from "@/components/ui/page-title";
import { createClient } from "@/lib/supabase";
import { getTodayString, computeStreak } from "@/lib/sm2";

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
const PROG_TRACK  = tokens.color.bgGrey;
const NAV_PILL    = tokens.color.navPill;
const BUTTER      = tokens.color.butter;
const SAGE        = tokens.color.sage;
const ROSE        = tokens.color.rose;

// Spacing tokens (from tokens.spacing scale)
const ROW_GAP     = tokens.spacing["4"];     // 16px
const COL_GAP     = tokens.spacing["3"];     // 12px
const H_PAD       = tokens.spacing["4"];     // 16px
const SECTION_GAP = tokens.spacing["6"];     // 24px

// ── Types ─────────────────────────────────────────────────────────────────────

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
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 1024;

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = getTodayString();

      // Parallel fetch: sets owned by user + all their progress rows + streak timestamps
      const [setsResult, progressResult, streakResult] = await Promise.all([
        supabase.from("sets").select("id, name, cards").eq("user_id", user.id),
        supabase
          .from("user_progress")
          .select("set_id, repetitions, next_review")
          .eq("user_id", user.id),
        supabase
          .from("user_progress")
          .select("last_studied")
          .eq("user_id", user.id)
          .order("last_studied", { ascending: false })
          .limit(500),
      ]);

      const setsData = setsResult.data || [];
      const progressRows = progressResult.data || [];

      setCurrentStreak(
        computeStreak((streakResult.data || []).map((r: any) => r.last_studied).filter(Boolean))
      );

      // Aggregate per-set stats from user_progress rows
      const statsBySet = new Map<string, { known: number; toReview: number }>();
      for (const row of progressRows) {
        if (!statsBySet.has(row.set_id)) statsBySet.set(row.set_id, { known: 0, toReview: 0 });
        const s = statsBySet.get(row.set_id)!;
        if (row.repetitions >= 3) s.known++;
        if (row.next_review <= today) s.toReview++;
      }

      // Only show sets the user has actually studied (has at least one progress row)
      const progressSets: SetProgress[] = setsData
        .filter((set: any) => statsBySet.has(set.id))
        .map((set: any, index: number) => {
          const stats = statsBySet.get(set.id)!;
          return {
            id: set.id,
            title: set.name,
            cardCount: (set.cards || []).length,
            known: stats.known,
            toReview: stats.toReview,
            color: (index % 2 === 0 ? "blue" : "pink") as "blue" | "pink",
          };
        });

      setSets(progressSets);
    } catch {
      setSets([]);
    } finally {
      setLoading(false);
    }
  };

  const totalCards = sets.reduce((s, x) => s + x.cardCount, 0);
  const totalKnown = sets.reduce((s, x) => s + x.known, 0);
  const totalReview = sets.reduce((s, x) => s + x.toReview, 0);
  const overallPct = totalCards > 0 ? Math.round((totalKnown / totalCards) * 100) : 0;

  // Shared content component
  const ContentArea = () => {
    return (
      <>
        {/* Title with streak badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: `${SECTION_GAP}px`,
          }}
        >
          <PageTitle>Progreso</PageTitle>
          {currentStreak > 0 && (
            <div
              style={{
                background: BUTTER,
                borderRadius: "50px",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 700,
                color: TEXT_PRI,
              }}
            >
              <span>💧</span>
              <span>{currentStreak} días seguidos</span>
            </div>
          )}
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
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            height: '0',
            paddingBottom: "100px"
          }}>
            <div style={{ padding: `0 ${H_PAD}px` }}>
              <ContentArea />
            </div>
          </div>

          {/* ── Navigation ── */}
          <AppNav active="progreso" onNavigate={onNavigate} />

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
                background: tokens.color.progressIndent,
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
            background: tokens.color.bgDesktopPage,
            display: "flex",
            flexDirection: "row",
          }}
        >
          {/* Navigation (renders sidebar on desktop) */}
          <AppNav active="progreso" onNavigate={onNavigate} />

          {/* Sidebar spacer for desktop layout */}
          <div style={{ display: "none" }} className="hidden lg:block lg:w-64 flex-shrink-0" />

          {/* Main content area */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: tokens.color.bgDesktopPage,
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
  const badgeBg = color === "blue" ? tokens.color.bgSageSuccess : tokens.color.bgRoseSoft;
  const arrowBg = color === "blue" ? tokens.color.bgSageSuccess : tokens.color.bgRoseSoft;
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

