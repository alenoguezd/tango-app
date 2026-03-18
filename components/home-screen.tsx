"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Share2 } from "lucide-react";
import { type VocabCard } from "@/components/flashcard";
import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase";
import { tokens } from "@/lib/design-tokens";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DeckSet {
  id: string;
  title: string;
  cardCount: number;
  progress: number;
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

// ── Design tokens ────────────────────────────────────────────────────────
const W = tokens.color.surface;
const BG_PAGE = tokens.color.page;
const FONT_UI = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

// Colors
const TEXT_PRI = "#1A1A1A";
const TEXT_SEC = "#B0A898";
const SAGE = "#A8C87A";
const ROSE = "#F2B8CD";
const BUTTER = "#F5DC7A";
const BORDER = "#EEEBE6";
const BADGE_BG = "#E8F4D8";
const BADGE_GREEN_TEXT = "#2A5010";
const BADGE_PINK_BG = "#FDE8F0";
const BADGE_PINK_TEXT = "#7A3550";
const BADGE_YELLOW_BG = "#FEF7D6";
const BADGE_YELLOW_TEXT = "#6B5500";
const BUTTON_BG = "#F5F2EC";
const BUTTON_BG_LOW = "#FDE8F0";

// Spacing
const H_PAD = 16;
const SECTION_GAP = 24;
const CARD_RADIUS = 14;

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

  return mounted ? windowWidth : 1024;
}

// ── HomeScreen ────────────────────────────────────────────────────────────────
export function HomeScreen({ sets: propSets, recent, onContinue, onStudy, onNavigate, onLogout }: HomeScreenProps) {
  const [localSets, setLocalSets] = useState<DeckSet[]>(propSets || []);
  const [userName, setUserName] = useState<string>("Usuario");
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

    // Fetch user name
    const fetchUserName = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const name = user.email.split("@")[0];
          setUserName(name.charAt(0).toUpperCase() + name.slice(1));
        }
      } catch (err) {
        console.log("Could not fetch user name");
      }
    };

    fetchUserName();
  }, []);

  // Show toast notification
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  // Calculate average progress
  const avgProgress = localSets.length > 0
    ? Math.round(localSets.reduce((sum, s) => sum + s.progress, 0) / localSets.length)
    : 0;

  // Count sets that need study (progress < 100)
  const needsStudy = localSets.filter(s => s.progress < 100).length;

  // Share set
  const handleShare = async (setId: string) => {
    const supabase = createClient();
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

    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${setId}`;

    try {
      // Try to copy to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        showToast("¡Link copiado!");
      } else {
        // Fallback for non-secure contexts or older browsers
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          showToast("¡Link copiado!");
        } catch (err) {
          console.error("Fallback copy failed:", err);
          showToast("No se pudo copiar el link");
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error("Clipboard error:", err);
      showToast("No se pudo copiar el link");
    }
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
      }
    } catch (err) {
      console.error("[Favorite] Supabase sync failed:", err);
      showToast("Error al guardar favorito en la nube");
    }
  };

  // Delete set
  const handleDeleteSet = async (setId: string) => {
    if (confirm("¿Eliminar este set? Esta acción no se puede deshacer")) {
      setLocalSets((prev) => {
        const updated = prev.filter((set) => set.id !== setId);
        localStorage.setItem("vocab_sets", JSON.stringify(updated));
        return updated;
      });

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
            showToast("Set eliminado");
          }
        }
      } catch (err) {
        console.error("[Delete] Error:", err);
        showToast("Error al eliminar el set");
      }
    }
  };

  // Reset progress
  const handleResetProgress = async (setId: string) => {
    if (confirm("¿Reiniciar el progreso de este set? Esta acción no se puede deshacer")) {
      try {
        const savedSets = localStorage.getItem("vocab_sets");
        if (savedSets) {
          const sets = JSON.parse(savedSets);
          const updatedSets = sets.map((s: any) =>
            s.id === setId
              ? {
                  ...s,
                  progress: 0,
                  cards: (s.cards || []).map((card: any) => ({ ...card, known: false })),
                }
              : s
          );
          localStorage.setItem("vocab_sets", JSON.stringify(updatedSets));
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const set = localSets.find(s => s.id === setId);
          if (set) {
            const resetCards = (set.cards || []).map(card => ({ ...card, known: false }));
            await supabase
              .from("sets")
              .update({ progress: 0, cards: resetCards })
              .eq("id", setId)
              .eq("user_id", user.id);
            showToast("¡Progreso reiniciado!");
          }
        }
      } catch (err) {
        console.error("[ResetProgress] Error:", err);
        showToast("Error al reiniciar progreso");
      }
    }
  };

  // Rename set
  const handleRenameSet = async (setId: string, newName: string) => {
    if (!newName.trim()) return;

    setLocalSets((prev) => {
      const updated = prev.map((set) =>
        set.id === setId ? { ...set, title: newName.trim() } : set
      );
      localStorage.setItem("vocab_sets", JSON.stringify(updated));
      return updated;
    });

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("sets")
          .update({ name: newName.trim() })
          .eq("id", setId)
          .eq("user_id", user.id);
      }
    } catch (err) {
      console.error("[Rename] Error:", err);
    }
  };

  // Sort sets: favorites first
  const sortedSets = [...localSets].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return 0;
  });

  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 1024;

  // ── Content Area (shared between layouts) ──
  const ContentArea = () => (
    <>
      {/* Greeting Section */}
      <div style={{ marginBottom: SECTION_GAP }}>
        <h1 style={{
          fontFamily: FONT_UI,
          fontSize: "22px",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: TEXT_PRI,
          margin: "0 0 8px 0",
          lineHeight: "1.2",
        }}>
          ¡Hola, {userName}!
        </h1>
        <p style={{
          fontFamily: FONT_UI,
          fontSize: "13px",
          fontWeight: 400,
          color: TEXT_SEC,
          margin: 0,
          lineHeight: "1.6",
        }}>
          Mantén tu aprendizaje en marcha
        </p>
      </div>

      {/* Daily Goal Progress Card */}
      {localSets.length > 0 && (
        <div style={{
          background: W,
          border: `0.5px solid ${BORDER}`,
          borderRadius: CARD_RADIUS,
          padding: "20px",
          marginBottom: SECTION_GAP,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
          }}>
            <div>
              <p style={{
                fontFamily: FONT_UI,
                fontSize: "10px",
                fontWeight: 400,
                color: TEXT_SEC,
                margin: "0 0 4px 0",
              }}>
                Progreso general
              </p>
              <div style={{
                display: "flex",
                alignItems: "baseline",
                gap: "4px",
              }}>
                <span style={{
                  fontFamily: FONT_UI,
                  fontSize: "32px",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: TEXT_PRI,
                }}>
                  {avgProgress}%
                </span>
              </div>
            </div>
            <div style={{
              background: BUTTER,
              borderRadius: "9999px",
              padding: "6px 16px",
              fontFamily: FONT_UI,
              fontSize: "13px",
              fontWeight: 700,
              color: BADGE_YELLOW_TEXT,
            }}>
              {localSets.length} sets
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            position: "relative",
            width: "100%",
            height: "5px",
            borderRadius: "3px",
            background: BORDER,
          }}>
            <div style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${avgProgress}%`,
              borderRadius: "3px",
              background: SAGE,
            }} />
          </div>
        </div>
      )}

      {/* Needs Study Section */}
      {needsStudy > 0 && (
        <div style={{
          background: "#FFF8F0",
          borderRadius: CARD_RADIUS,
          padding: "16px",
          marginBottom: SECTION_GAP,
          border: `0.5px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}>
          <div>
            <p style={{
              fontFamily: FONT_UI,
              fontSize: "10px",
              fontWeight: 400,
              color: TEXT_SEC,
              margin: "0 0 4px 0",
            }}>
              Repasar
            </p>
            <p style={{
              fontFamily: FONT_UI,
              fontSize: "22px",
              fontWeight: 800,
              color: TEXT_PRI,
              margin: 0,
            }}>
              {needsStudy}
            </p>
          </div>
          <button
            onClick={() => {
              const firstIncomplete = localSets.find(s => s.progress < 100);
              if (firstIncomplete) onStudy(firstIncomplete);
            }}
            style={{
              flexShrink: 0,
              background: ROSE,
              border: "none",
              borderRadius: "9999px",
              padding: "12px 20px",
              fontFamily: FONT_UI,
              fontSize: "13px",
              fontWeight: 700,
              color: BADGE_PINK_TEXT,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            Empezar
            <ArrowRight style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
      )}

      {/* Empty State */}
      {localSets.length === 0 ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: "400px",
          gap: "16px",
        }}>
          <div style={{ fontSize: "48px" }}>📚</div>
          <h2 style={{
            fontFamily: FONT_UI,
            fontSize: "20px",
            fontWeight: 600,
            color: TEXT_PRI,
            margin: 0,
          }}>
            Aún no tienes sets
          </h2>
          <p style={{
            fontFamily: FONT_UI,
            fontSize: "13px",
            color: TEXT_SEC,
            margin: 0,
            maxWidth: "280px",
          }}>
            Crea tu primer set para empezar a aprender
          </p>
          <button
            onClick={() => onNavigate("crear")}
            style={{
              background: SAGE,
              border: "none",
              borderRadius: "9999px",
              padding: "12px 24px",
              fontFamily: FONT_UI,
              fontSize: "13px",
              fontWeight: 700,
              color: "#fff",
              cursor: "pointer",
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            + Crear set
          </button>
        </div>
      ) : (
        <>
          {/* My Sets Section */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}>
            <h2 style={{
              fontFamily: FONT_UI,
              fontSize: "17px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: TEXT_PRI,
              margin: 0,
            }}>
              Mis sets
            </h2>
            <button
              onClick={() => onNavigate("crear")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: FONT_UI,
                fontSize: "13px",
                fontWeight: 700,
                color: SAGE,
                padding: "6px 0",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              + Nuevo
            </button>
          </div>

          {/* Sets List */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            paddingBottom: "24px",
          }}>
            {sortedSets.map((set) => (
              <SetCard
                key={set.id}
                set={set}
                onStudy={() => onStudy(set)}
                onShare={() => handleShare(set.id)}
                onToggleFavorite={() => handleToggleFavorite(set.id)}
                onDelete={() => handleDeleteSet(set.id)}
                onResetProgress={() => handleResetProgress(set.id)}
                onRename={(newName) => handleRenameSet(set.id, newName)}
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

          {/* Scrollable body */}
          <div style={{
            flex: 1,
            overflowY: "scroll",
            WebkitOverflowScrolling: "touch",
            height: "0",
            paddingBottom: "100px",
          }}>
            <div style={{ padding: `0 ${H_PAD}px` }}>
              <ContentArea />
            </div>
          </div>

          {/* Bottom navigation */}
          <nav
            aria-label="Navegación principal"
            style={{
              flexShrink: 0,
              width: "100%",
              background: W,
              borderTop: `1px solid ${BORDER}`,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-around",
              paddingTop: "10px",
              paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px) + 8px)",
            }}
          >
            <NavItem label="Inicio" active icon={<SmileIcon />} onClick={() => {}} />
            <NavItem label="Crear" active={false} icon={<FolderIcon />} onClick={() => onNavigate("crear")} />
            <NavItem label="Progreso" active={false} icon={<PlayIcon />} onClick={() => onNavigate("progreso")} />
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
          background: BG_PAGE,
          display: "flex",
          flexDirection: "row",
        }}>
          <AppSidebar activeTab="inicio" onNavigate={onNavigate} onLogout={onLogout} />

          {/* Main content area */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: BG_PAGE,
          }}>
            {/* Safe-area top spacer */}
            <div aria-hidden style={{
              flexShrink: 0,
              height: "max(16px, env(safe-area-inset-top, 0px))",
            }} />

            {/* Scrollable content */}
            <div style={{
              flex: 1,
              overflowY: "scroll",
              WebkitOverflowScrolling: "touch",
              height: "100vh",
              paddingBottom: "40px",
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
            fontFamily: FONT_UI,
            fontSize: "13px",
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

// ── SetCard ────────────────────────────────────────────────────────────────────
function SetCard({
  set,
  onStudy,
  onShare,
  onToggleFavorite,
  onDelete,
  onResetProgress,
  onRename,
}: {
  set: DeckSet;
  onStudy: () => void;
  onShare: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onResetProgress: () => void;
  onRename: (newName: string) => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [editedName, setEditedName] = useState(set.title);
  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 1024;

  // Determine mastery badge colors based on progress
  let badgeBg = BADGE_YELLOW_BG;
  let badgeText = BADGE_YELLOW_TEXT;
  if (set.progress > 50) {
    badgeBg = BADGE_BG;
    badgeText = BADGE_GREEN_TEXT;
  } else if (set.progress < 30) {
    badgeBg = BADGE_PINK_BG;
    badgeText = BADGE_PINK_TEXT;
  }

  // Determine progress bar color
  let progressBarColor = BUTTER;
  if (set.progress > 50) {
    progressBarColor = SAGE;
  } else if (set.progress < 30) {
    progressBarColor = ROSE;
  }

  // Determine button background based on progress
  let arrowBtnBg = BUTTON_BG;
  let arrowBtnStroke = TEXT_PRI;
  if (set.progress < 30) {
    arrowBtnBg = BUTTON_BG_LOW;
    arrowBtnStroke = BADGE_PINK_TEXT;
  }

  const handleRename = () => {
    if (editedName.trim() && editedName !== set.title) {
      onRename(editedName.trim());
    } else {
      setEditedName(set.title);
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setEditedName(set.title);
      setIsRenaming(false);
    }
  };

  // Time since last studied
  const getTimeSinceStudied = (lastStudied: string) => {
    try {
      const date = new Date(lastStudied);
      const now = new Date();
      const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (hours < 1) return "Hace un momento";
      if (hours < 24) return `Hace ${hours}h`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `Hace ${days}d`;
      return "Hace semanas";
    } catch {
      return "Nunca";
    }
  };

  return (
    <div
      style={{
        background: W,
        border: `0.5px solid ${BORDER}`,
        borderRadius: CARD_RADIUS,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Top row: name on left, mastery badge on right */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "8px",
      }}>
        <div style={{ flex: 1 }}>
          {isRenaming ? (
            <input
              autoFocus
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              style={{
                fontFamily: FONT_UI,
                fontSize: "14px",
                fontWeight: 700,
                color: TEXT_PRI,
                border: `1px solid ${SAGE}`,
                borderRadius: "6px",
                padding: "6px 8px",
                width: "100%",
              }}
            />
          ) : (
            <h3 style={{
              fontFamily: FONT_UI,
              fontSize: "14px",
              fontWeight: 700,
              color: TEXT_PRI,
              margin: 0,
              cursor: "pointer",
            }} onClick={() => setIsRenaming(true)}>
              {set.title}
            </h3>
          )}
          <p style={{
            fontFamily: FONT_UI,
            fontSize: "10px",
            fontWeight: 400,
            color: TEXT_SEC,
            margin: "2px 0 0 0",
          }}>
            {set.cardCount} tarjetas • {getTimeSinceStudied(set.lastStudied)}
          </p>
        </div>

        {/* Mastery badge */}
        <div style={{
          background: badgeBg,
          borderRadius: "9999px",
          padding: "4px 10px",
          fontFamily: FONT_UI,
          fontSize: "10px",
          fontWeight: 700,
          color: badgeText,
          flexShrink: 0,
        }}>
          {set.progress}%
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        position: "relative",
        width: "100%",
        height: "5px",
        borderRadius: "3px",
        background: BORDER,
      }}>
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${set.progress}%`,
          borderRadius: "3px",
          background: progressBarColor,
        }} />
      </div>

      {/* Bottom row: only action button on right */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "8px",
      }}>
        {/* Share button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            background: "transparent",
            border: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            color: TEXT_SEC,
          }}
          title="Compartir set"
        >
          <Share2 style={{ width: "16px", height: "16px", strokeWidth: 2 }} />
        </button>

        {/* Action button (circular arrow) */}
        <button
          onClick={onStudy}
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            background: arrowBtnBg,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
          title="Estudiar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ stroke: arrowBtnStroke, strokeWidth: 2 }}>
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── NavItem ────────────────────────────────────────────────────────────────────
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
      <div style={{
        width: active ? "64px" : "44px",
        height: "32px",
        borderRadius: "16px",
        background: active ? "#F0F0F0" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? TEXT_PRI : TEXT_SEC,
        transition: "width 0.15s ease, background 0.15s ease",
      }}>
        {icon}
      </div>
      <span style={{
        fontFamily: FONT_UI,
        fontSize: "11px",
        fontWeight: active ? 700 : 400,
        color: active ? TEXT_PRI : TEXT_SEC,
      }}>
        {label}
      </span>
    </button>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
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

function FolderIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 7h3l2-2h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
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
