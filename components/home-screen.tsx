"use client";

import { useEffect, useState } from "react";
import { Plus, MoreVertical, Star, ArrowRight } from "lucide-react";
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
const FONT_UI = "var(--font-ui)";

// Text colors
const TEXT_PRI = tokens.color.ink;
const TEXT_SEC = tokens.color.muted;
const TEXT_MUT = tokens.color.muted;
const TEXT_RED = tokens.color.rose;

// Accent colors (from design tokens)
const SAGE_ACCENT = tokens.color.sage;
const ROSE_ACCENT = tokens.color.rose;
const BUTTER_ACCENT = tokens.color.butter;
const SKY_ACCENT = tokens.color.sky;

// Card styling
const CARD_BORDER = tokens.color.border;
const CARD_RADIUS = 14;
const H_PAD = 16;
const SECTION_GAP = 24;

// Progress bar
const PROG_FG = tokens.color.sage;
const PROG_TRACK = "#E8E8E8";

// Nav
const NAV_PILL = "#F0F0F0";

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

  // Share set: copy link to clipboard
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
            const { error } = await supabase
              .from("sets")
              .update({ progress: 0, cards: resetCards })
              .eq("id", setId)
              .eq("user_id", user.id);

            if (error) {
              console.error("[ResetProgress] Supabase update failed:", error);
            } else {
              console.log("[ResetProgress] Progress reset in Supabase");
              showToast("¡Progreso reiniciado!");
            }
          }
        }
      } catch (err) {
        console.error("[ResetProgress] Error:", err);
        showToast("Error al reiniciar progreso");
      }
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
      <div style={{
        marginBottom: SECTION_GAP,
      }}>
        <h1 style={{
          fontFamily: FONT_UI,
          fontSize: "var(--text-display)",
          fontWeight: 800,
          color: TEXT_PRI,
          margin: "0 0 8px 0",
          lineHeight: "1.2",
          letterSpacing: "-0.02em",
        }}>
          ¡Hola, {userName}!
        </h1>
        <p style={{
          fontFamily: FONT_UI,
          fontSize: "var(--text-body)",
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
          border: `1px solid ${CARD_BORDER}`,
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
                fontSize: "var(--text-meta)",
                color: TEXT_SEC,
                margin: "0 0 4px 0",
                fontWeight: 400,
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
                  fontSize: "var(--text-card-word)",
                  fontWeight: 700,
                  color: TEXT_PRI,
                }}>
                  {avgProgress}%
                </span>
              </div>
            </div>
            <div style={{
              background: BUTTER_ACCENT,
              borderRadius: "8px",
              padding: "8px 12px",
              fontFamily: FONT_UI,
              fontSize: "var(--text-button)",
              fontWeight: 700,
              color: TEXT_PRI,
            }}>
              {localSets.length} sets
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            position: "relative",
            width: "100%",
            height: "6px",
            borderRadius: "3px",
            background: PROG_TRACK,
          }}>
            <div style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${avgProgress}%`,
              borderRadius: "3px",
              background: PROG_FG,
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
          border: `1px solid ${ROSE_ACCENT}20`,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <p style={{
                fontFamily: FONT_UI,
                fontSize: "14px",
                color: TEXT_SEC,
                margin: "0 0 4px 0",
              }}>
                Por reparar
              </p>
              <p style={{
                fontFamily: FONT_UI,
                fontSize: "24px",
                fontWeight: 700,
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
                background: ROSE_ACCENT,
                border: "none",
                borderRadius: tokens.radius.btn,
                padding: "10px 16px",
                fontFamily: FONT_UI,
                fontSize: "14px",
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              Empezar
              <ArrowRight style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
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
          <div style={{
            fontSize: "48px",
          }}>
            📚
          </div>
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
            fontSize: "15px",
            color: TEXT_SEC,
            margin: 0,
            maxWidth: "280px",
          }}>
            Crea tu primer set para empezar a aprender
          </p>
          <button
            onClick={() => onNavigate("crear")}
            style={{
              background: SAGE_ACCENT,
              border: "none",
              borderRadius: tokens.radius.btn,
              padding: "12px 24px",
              fontFamily: FONT_UI,
              fontSize: "15px",
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus style={{ width: "18px", height: "18px" }} />
            Crear set
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
              fontSize: "18px",
              fontWeight: 600,
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
                fontSize: "14px",
                fontWeight: 600,
                color: SAGE_ACCENT,
                padding: "6px 0",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Plus style={{ width: "18px", height: "18px" }} />
              Nuevo
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
              <SetListItem
                key={set.id}
                set={set}
                onStudy={() => onStudy(set)}
                onShare={() => handleShare(set.id)}
                onToggleFavorite={() => handleToggleFavorite(set.id)}
                onDelete={() => handleDeleteSet(set.id)}
                onResetProgress={() => handleResetProgress(set.id)}
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
              borderTop: `1px solid ${CARD_BORDER}`,
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

// ── SetListItem ────────────────────────────────────────────────────────────────
function SetListItem({
  set,
  onStudy,
  onShare,
  onToggleFavorite,
  onDelete,
  onResetProgress,
}: {
  set: DeckSet;
  onStudy: () => void;
  onShare: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onResetProgress: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(set.title);
  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 1024;

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
      const savedSets = localStorage.getItem("vocab_sets");
      if (savedSets) {
        const sets = JSON.parse(savedSets);
        const updatedSets = sets.map((s: any) =>
          s.id === set.id ? { ...s, title: editedName.trim() } : s
        );
        localStorage.setItem("vocab_sets", JSON.stringify(updatedSets));
      }

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

  const showMenuButton = isMobile || isHovering;

  return (
    <button
      onClick={onStudy}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        textAlign: "left",
        background: W,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: CARD_RADIUS,
        padding: "16px",
        cursor: "pointer",
        position: "relative",
      }}
    >
      <div style={{ flex: 1 }}>
        {isEditing ? (
          <input
            autoFocus
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={saveName}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{
              fontFamily: FONT_UI,
              fontSize: "16px",
              fontWeight: 600,
              color: TEXT_PRI,
              border: `1px solid ${SAGE_ACCENT}`,
              borderRadius: "8px",
              padding: "8px 12px",
              width: "100%",
              maxWidth: "300px",
            }}
          />
        ) : (
          <>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}>
              <h3 style={{
                fontFamily: FONT_UI,
                fontSize: "16px",
                fontWeight: 600,
                color: TEXT_PRI,
                margin: 0,
              }}>
                {set.title}
              </h3>
              {set.favorite && (
                <Star
                  style={{
                    width: "16px",
                    height: "16px",
                    fill: BUTTER_ACCENT,
                    color: BUTTER_ACCENT,
                  }}
                />
              )}
            </div>
            <p style={{
              fontFamily: FONT_UI,
              fontSize: "13px",
              color: TEXT_SEC,
              margin: "0 0 8px 0",
            }}>
              {set.cardCount} tarjetas • {set.progress}% completo
            </p>

            {/* Mini progress bar */}
            <div style={{
              position: "relative",
              width: "100%",
              height: "4px",
              borderRadius: "2px",
              background: PROG_TRACK,
            }}>
              <div style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: `${set.progress}%`,
                borderRadius: "2px",
                background: PROG_FG,
              }} />
            </div>
          </>
        )}
      </div>

      {/* Menu button */}
      {showMenuButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          style={{
            flexShrink: 0,
            width: "32px",
            height: "32px",
            padding: "0",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: TEXT_SEC,
            marginLeft: "12px",
          }}
          aria-label="Más opciones"
        >
          <MoreVertical style={{ width: "20px", height: "20px" }} />
        </button>
      )}

      {/* Dropdown menu */}
      {menuOpen && (
        <>
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
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: "0",
              background: W,
              border: `1px solid ${CARD_BORDER}`,
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              zIndex: 20,
              minWidth: "160px",
              marginTop: "4px",
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
                fontFamily: FONT_UI,
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
                fontFamily: FONT_UI,
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
                fontFamily: FONT_UI,
                fontSize: "14px",
                color: TEXT_PRI,
                borderBottom: `1px solid ${CARD_BORDER}`,
              }}
            >
              Favorito
            </button>
            <button
              onClick={() => handleMenuAction(onResetProgress)}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "none",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: FONT_UI,
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
                fontFamily: FONT_UI,
                fontSize: "14px",
                color: TEXT_RED,
              }}
            >
              Eliminar
            </button>
          </div>
        </>
      )}
    </button>
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
        fontFamily: FONT_UI,
        fontSize: "11px",
        fontWeight: active ? 700 : 400,
        color: active ? TEXT_PRI : TEXT_MUT,
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
