"use client";

import { useEffect, useState } from "react";
import { Upload, ArrowRight, FolderOpen, Play, MoreVertical, Star } from "lucide-react";
import { type VocabCard } from "@/components/flashcard";
import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase";
import { tokens } from "@/lib/design-tokens";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DeckSet {
  id: string;
  title: string;
  cardCount: number;
  progress: number;   // 0–100
  lastStudied: string;
  cards: VocabCard[];
  color?: "blue" | "pink";
  favorite?: boolean;
}

interface HomeScreenProps {
  sets?: DeckSet[];
  recent?: DeckSet | null;
  onContinue?: (set: DeckSet) => void;
  onStudy: (set: DeckSet) => void;
  onNavigate: (tab: "inicio" | "crear" | "progreso") => void;
  onLogout?: () => void;
}

// ── Design tokens ────────────────────────────────────────────────────────────
const W           = tokens.color.surface;
const BG_PAGE     = tokens.color.page;
const FONT        = "var(--font-sans)";

// Text
const TEXT_PRI    = tokens.color.ink;
const TEXT_SEC    = tokens.color.muted;
const TEXT_MUT    = tokens.color.muted;
const TEXT_RED    = tokens.color.rose;

// Accent
const LINK_ACCENT = tokens.color.sage;

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

// ── HomeScreen ────────────────────────────────────────────────────────────────
export function HomeScreen({ sets: propSets, recent, onContinue, onStudy, onNavigate, onLogout }: HomeScreenProps) {
  const [localSets, setLocalSets] = useState<DeckSet[]>(propSets || []);
  const [toast, setToast] = useState<string | null>(null);

  // Load sets from localStorage on mount
  useEffect(() => {
    const savedSets = localStorage.getItem("vocab_sets");
    if (savedSets) {
      try {
        setLocalSets(JSON.parse(savedSets));
      } catch (error) {
        console.error("Error loading sets from localStorage:", error);
        setLocalSets([]);
      }
    }
  }, []);

  // Show toast notification
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };


  // Share set: copy link to clipboard
  const handleShare = async (setId: string) => {
    const supabase = createClient();

    // Try to set is_public in Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("sets")
          .update({ is_public: true })
          .eq("id", setId)
          .eq("user_id", user.id);
      }
    } catch (err) {
      console.log("Could not set public status in Supabase");
    }

    // Copy public study link
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${setId}`;
    navigator.clipboard.writeText(url);
    showToast("¡Link copiado!");
  };

  // Toggle favorite
  const handleToggleFavorite = async (setId: string) => {
    setLocalSets((prev) => {
      const updated = prev.map((set) =>
        set.id === setId ? { ...set, favorite: !set.favorite } : set
      );
      localStorage.setItem("vocab_sets", JSON.stringify(updated));
      return updated;
    });

    // Sync to Supabase
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const set = localSets.find(s => s.id === setId);
        const newFavoriteStatus = !set?.favorite;

        await supabase
          .from("sets")
          .update({ is_favorite: newFavoriteStatus })
          .eq("id", setId)
          .eq("user_id", user.id);

        console.log("[Favorite] Updated in Supabase");
      }
    } catch (err) {
      console.error("[Favorite] Supabase sync failed:", err);
      showToast("Error al guardar favorito en la nube");
    }
  };

  // Delete set
  const handleDeleteSet = async (setId: string) => {
    if (confirm("¿Eliminar este set? Esta acción no se puede deshacer")) {
      // Remove from localStorage immediately for UI feedback
      setLocalSets((prev) => {
        const updated = prev.filter((set) => set.id !== setId);
        localStorage.setItem("vocab_sets", JSON.stringify(updated));
        return updated;
      });

      // Delete from Supabase
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { error } = await supabase
            .from("sets")
            .delete()
            .eq("id", setId)
            .eq("user_id", user.id);

          if (error) {
            console.error("[Delete] Supabase delete failed:", error);
            showToast("Error al eliminar de la nube");
          } else {
            console.log("[Delete] Deleted from Supabase");
            showToast("Set eliminado");
          }
        }
      } catch (err) {
        console.error("[Delete] Error:", err);
        showToast("Error al eliminar el set");
      }
    }
  };

  // Sort sets: favorites first
  const sortedSets = [...localSets].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return 0;
  });

  // Get the most recently studied set, or most recently created if none studied
  const recentItem = localSets.length > 0
    ? localSets.reduce((prev, current) => {
        const prevDate = new Date(prev.lastStudied || "");
        const currentDate = new Date(current.lastStudied || "");
        return currentDate > prevDate ? current : prev;
      })
    : null;
  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 1024;

  // Shared content component (reusable across layouts)
  const ContentArea = () => (
    <>
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
        Inicio
      </h1>

      {/* ── Upload banner ── */}
      <button
        onClick={() => onNavigate("crear")}
        style={{
          background: BANNER_BG,
          borderRadius: "14px",
          padding: "18px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: `${SECTION_GAP}px`,
          border: "none",
          cursor: "pointer",
          width: "100%",
        }}
      >
        <p style={{
          fontFamily: FONT,
          fontSize: "15px",
          fontWeight: 400,
          color: TEXT_PRI,
          lineHeight: 1.4,
          flex: 1,
          margin: 0,
          textAlign: "left",
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
      </button>

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
          onClick={() => onStudy(recentItem)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            background: W,
            border: `1px solid ${CARD_BORDER}`,
            borderRadius: "12px",
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
          borderRadius: "12px",
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

      {/* ── Empty state ── */}
      {localSets.length === 0 ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: "300px",
          gap: "16px",
        }}>
          <h2 style={{
            fontFamily: FONT,
            fontSize: "20px",
            fontWeight: 500,
            color: TEXT_PRI,
            margin: 0,
          }}>
            Aún no tienes sets
          </h2>
          <p style={{
            fontFamily: FONT,
            fontSize: "15px",
            color: TEXT_SEC,
            margin: 0,
          }}>
            Ve a Crear para subir tu primera foto
          </p>
        </div>
      ) : (
        <>
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
              color: LINK_ACCENT,
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

          {/* ── Sets grid ––
              paddingTop = TAB_H so the overflowing SVG tab has room */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: `${COL_GAP}px`,
            rowGap: `${ROW_GAP + TAB_H}px`,
            paddingTop: `${TAB_H + 4}px`,
            paddingBottom: "24px",
          }}>
            {sortedSets.map((set, i) => (
              <SetCard
                key={set.id}
                set={set}
                color={set.color ?? (i % 2 === 0 ? "blue" : "pink")}
                onClick={() => onStudy(set)}
                onShare={() => handleShare(set.id)}
                onToggleFavorite={() => handleToggleFavorite(set.id)}
                onDelete={() => handleDeleteSet(set.id)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      {/* ===== MOBILE LAYOUT (< 1024px) ===== */}
      {isMobile && (
      <div style={{
        height: "100dvh",
        maxWidth: "375px",
        margin: "0 auto",
        background: BG_PAGE,
        display: "flex",
        flexDirection: "column",
      }}>
      {/* Safe-area top spacer */}
      <div aria-hidden style={{
        flexShrink: 0,
        height: "max(16px, env(safe-area-inset-top, 0px))",
        background: BG_PAGE,
      }} />

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
        <NavItem label="Inicio"  active       icon={<SmileIcon />} onClick={() => {}} />
        <NavItem label="Crear"   active={false} icon={<FolderOpen style={{ width: "22px", height: "22px", strokeWidth: 1.8 }} />} onClick={() => onNavigate("crear")} />
        <NavItem label="Progreso" active={false} icon={<Play style={{ width: "20px", height: "20px", strokeWidth: 1.8 }} />} onClick={() => onNavigate("progreso")} />
        <NavItem label="Perfil" active={false} icon={<PersonIcon />} onClick={() => onNavigate("perfil")} />
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
      )}

      {/* ===== DESKTOP LAYOUT (≥ 1024px) ===== */}
      {!isMobile && (
      <div style={{
        height: "100dvh",
        background: "#F7F6F3",
        display: "flex",
        flexDirection: "row",
      }}>
        <AppSidebar activeTab="inicio" onNavigate={onNavigate} onLogout={onLogout} />

        {/* Main content area */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#F7F6F3",
        }}>
          {/* Safe-area top spacer */}
          <div aria-hidden style={{
            flexShrink: 0,
            height: "max(16px, env(safe-area-inset-top, 0px))",
          }} />

          {/* Scrollable content */}
          <div style={{
            flex: 1,
            overflowY: 'scroll',
            WebkitOverflowScrolling: 'touch',
            height: '100vh',
            paddingBottom: "40px"
          }}>
            <div style={{
              maxWidth: "680px",
              margin: "0 auto",
              padding: `0 ${H_PAD}px`,
              width: "100%",
            }}>
              <ContentArea />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: TEXT_PRI,
            color: W,
            padding: "12px 24px",
            borderRadius: "8px",
            fontFamily: FONT,
            fontSize: "14px",
            zIndex: 100,
            animation: "fadeInOut 2s ease-in-out",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}

// ── SetCard ───────────────────────────────────────────────────────────────────
function SetCard({
  set,
  color,
  onClick,
  onShare,
  onToggleFavorite,
  onDelete,
}: {
  set: DeckSet;
  color: "blue" | "pink";
  onClick: () => void;
  onShare: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  const handleResetProgress = async () => {
    if (confirm("¿Reiniciar el progreso de este set? Esta acción no se puede deshacer")) {
      try {
        // Reset in localStorage
        const savedSets = localStorage.getItem("vocab_sets");
        if (savedSets) {
          const sets = JSON.parse(savedSets);
          const updatedSets = sets.map((s: any) =>
            s.id === set.id
              ? {
                  ...s,
                  progress: 0,
                  cards: (s.cards || []).map((card: any) => ({ ...card, known: false })),
                }
              : s
          );
          localStorage.setItem("vocab_sets", JSON.stringify(updatedSets));
        }

        // Reset in Supabase
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const resetCards = (set.cards || []).map(card => ({ ...card, known: false }));
          const { error } = await supabase
            .from("sets")
            .update({ progress: 0, cards: resetCards })
            .eq("id", set.id)
            .eq("user_id", user.id);

          if (error) {
            console.error("[ResetProgress] Supabase update failed:", error);
            // Toast will be handled in parent scope
          } else {
            console.log("[ResetProgress] Progress reset in Supabase");
            showToastFromParent("¡Progreso reiniciado!");
          }
        }
      } catch (err) {
        console.error("[ResetProgress] Error:", err);
        showToastFromParent("Error al reiniciar progreso");
      }
    }
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(set.title);
  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 1024;
  const showMenuButton = isMobile || isHovering;

  const cardBg = color === "blue" ? BLUE_CARD : PINK_CARD;
  const tabFill = color === "blue" ? BLUE_TAB  : PINK_TAB;

  const handleMenuAction = (action: () => void) => {
    action();
    setMenuOpen(false);
  };

  const handleRename = () => {
    setIsEditing(true);
    setMenuOpen(false);
  };

  const saveName = async () => {
    if (editedName.trim()) {
      // Update localStorage first for immediate UI feedback
      const savedSets = localStorage.getItem("vocab_sets");
      if (savedSets) {
        const sets = JSON.parse(savedSets);
        const updatedSets = sets.map((s: any) =>
          s.id === set.id ? { ...s, title: editedName.trim() } : s
        );
        localStorage.setItem("vocab_sets", JSON.stringify(updatedSets));
      }
      set.title = editedName.trim();

      // Sync to Supabase
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { error } = await supabase
            .from("sets")
            .update({ name: editedName.trim() })
            .eq("id", set.id)
            .eq("user_id", user.id);

          if (error) {
            console.error("[Rename] Supabase update failed:", error);
          } else {
            console.log("[Rename] Updated in Supabase");
          }
        }
      } catch (err) {
        console.error("[Rename] Error:", err);
      }
    } else {
      setEditedName(set.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveName();
    } else if (e.key === "Escape") {
      setEditedName(set.title);
      setIsEditing(false);
    }
  };

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
        {isEditing ? (
          <input
            autoFocus
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={saveName}
            onKeyDown={handleKeyDown}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${TAB_H}px`,
              paddingLeft: "10px",
              paddingRight: "10px",
              fontFamily: FONT,
              fontSize: "11px",
              fontWeight: 500,
              border: "none",
              background: "transparent",
              color: TEXT_SEC,
            }}
          />
        ) : (
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
        )}
      </div>

      {/* Card body — top-left corner is flat (0) where tab connects */}
      <div
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          width: "100%",
          height: `${CARD_H}px`,
          textAlign: "left",
          background: cardBg,
          borderRadius: `0 ${CARD_RADIUS}px ${CARD_RADIUS}px ${CARD_RADIUS}px`,
          padding: `16px ${CARD_PAD_X}px 14px`,
          position: "relative",
        }}
      >
        {/* Menu button — only visible on hover (desktop) or always on mobile */}
        {showMenuButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "32px",
            height: "32px",
            padding: "0",
            background: "rgba(255,255,255,0.6)",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: TEXT_PRI,
          }}
          aria-label="Más opciones"
        >
          <MoreVertical style={{ width: "18px", height: "18px" }} />
        </button>
        )}

        {/* Dropdown menu */}
        {menuOpen && (
          <>
            {/* Backdrop to close menu */}
            <div
              onClick={() => setMenuOpen(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
              }}
            />
            {/* Menu items */}
            <div
              style={{
                position: "absolute",
                top: "40px",
                right: "0",
                background: W,
                border: `1px solid ${CARD_BORDER}`,
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                zIndex: 20,
                minWidth: "140px",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => handleMenuAction(onShare)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: FONT,
                  fontSize: "14px",
                  color: TEXT_PRI,
                  borderBottom: `1px solid ${CARD_BORDER}`,
                }}
              >
                Compartir
              </button>
              <button
                onClick={() => handleMenuAction(handleRename)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: FONT,
                  fontSize: "14px",
                  color: TEXT_PRI,
                  borderBottom: `1px solid ${CARD_BORDER}`,
                }}
              >
                Renombrar
              </button>
              <button
                onClick={() => handleMenuAction(onToggleFavorite)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: FONT,
                  fontSize: "14px",
                  color: TEXT_PRI,
                  borderBottom: `1px solid ${CARD_BORDER}`,
                }}
              >
                Favorito
              </button>
              <button
                onClick={() => handleMenuAction(handleResetProgress)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: FONT,
                  fontSize: "14px",
                  color: TEXT_PRI,
                  borderBottom: `1px solid ${CARD_BORDER}`,
                }}
              >
                Reiniciar progreso
              </button>
              <button
                onClick={() => handleMenuAction(onDelete)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: FONT,
                  fontSize: "14px",
                  color: TEXT_RED,
                }}
              >
                Eliminar
              </button>
            </div>
          </>
        )}

        {/* Card content */}
        <button
          onClick={onClick}
          style={{
            width: "100%",
            textAlign: "left",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0",
            font: "inherit",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
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
            </div>
            {set.favorite && (
              <Star
                style={{
                  width: "20px",
                  height: "20px",
                  fill: "#FFD700",
                  color: "#FFD700",
                  marginBottom: "4px",
                }}
              />
            )}
          </div>
        </button>
      </div>
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

function PersonIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 20c0-4.418 4.03-8 9-8s9 3.582 9 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
