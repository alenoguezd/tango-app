"use client";

import { useEffect, useState } from "react";
import { Share2, MoreVertical } from "lucide-react";
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
  const [userInitials, setUserInitials] = useState<string>("U");
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
        if (user) {
          // Try to use full_name from metadata, fallback to email
          const fullName = (user.user_metadata?.full_name as string) || "";
          const emailName = user.email?.split("@")[0] || "";
          const name = fullName || emailName;
          const displayName = name.charAt(0).toUpperCase() + name.slice(1);
          setUserName(displayName);
          setUserInitials(displayName.slice(0, 2).toUpperCase());
        }
      } catch (err) {
        console.log("Could not fetch user name");
      }
    };

    fetchUserName();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

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
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        showToast("¡Link copiado!");
      } else {
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

  const handleRenameSet = async (setId: string, currentName: string) => {
    const newName = prompt("Nuevo nombre del set:", currentName);
    if (!newName || newName === currentName) return;

    setLocalSets((prev) => {
      const updated = prev.map((set) =>
        set.id === setId ? { ...set, title: newName } : set
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
          .update({ name: newName })
          .eq("id", setId)
          .eq("user_id", user.id);
        showToast("Set renombrado");
      }
    } catch (err) {
      console.error("[Rename] Error:", err);
      showToast("Error al renombrar el set");
    }
  };

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
          await supabase
            .from("sets")
            .delete()
            .eq("id", setId)
            .eq("user_id", user.id);
          showToast("Set eliminado");
        }
      } catch (err) {
        console.error("[Delete] Error:", err);
        showToast("Error al eliminar el set");
      }
    }
  };

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

  // Calculate stats
  const avgProgress = localSets.length > 0
    ? Math.round(localSets.reduce((sum, s) => sum + s.progress, 0) / localSets.length)
    : 0;

  const needsStudy = localSets.reduce((count, set) => {
    const unknownCards = (set.cards || []).filter(card => card.known !== true).length;
    return count + unknownCards;
  }, 0);
  const sortedSets = [...localSets].sort((a, b) => {
    // Sort by most recently studied first
    const dateA = new Date(a.lastStudied).getTime();
    const dateB = new Date(b.lastStudied).getTime();
    if (dateA !== dateB) {
      return dateB - dateA; // Most recent first
    }
    // Secondary sort: favorites first
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return 0;
  });

  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 1024;

  // ===== Main Content =====
  const mainContent = (
    <div style={{ padding: `0 ${H_PAD}px` }}>
      {/* Header Section */}
      <div style={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        marginBottom: SECTION_GAP,
      }}>
        <div>
          <p style={{
            fontFamily: FONT_UI,
            fontSize: "12px",
            fontWeight: 400,
            color: TEXT_SEC,
            margin: "0 0 4px 0",
          }}>
            Hola de nuevo,
          </p>
          <h1 style={{
            fontFamily: FONT_UI,
            fontSize: "48px",
            fontWeight: 800,
            letterSpacing: "-0.01em",
            color: TEXT_PRI,
            margin: 0,
            lineHeight: 1,
          }}>
            {userName}
          </h1>
        </div>
      </div>

      {/* Meta de hoy Card */}
      {localSets.length > 0 && (() => {
        // Calculate today's study progress
        const studyLog = localStorage.getItem("study_log");
        let cardsStudiedToday = 0;

        if (studyLog) {
          try {
            const log: { date: string; cardsStudied: number }[] = JSON.parse(studyLog);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split("T")[0];

            const todayEntry = log.find((entry) => entry.date === todayStr);
            cardsStudiedToday = todayEntry ? todayEntry.cardsStudied : 0;
          } catch {
            cardsStudiedToday = 0;
          }
        }

        const dailyGoal = 30;
        const progress = Math.min(100, Math.round((cardsStudiedToday / dailyGoal) * 100));

        return (
          <div style={{
            background: W,
            border: `0.5px solid ${BORDER}`,
            borderRadius: CARD_RADIUS,
            padding: "16px 14px",
            marginBottom: SECTION_GAP,
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}>
              <h2 style={{
                fontFamily: FONT_UI,
                fontSize: "16px",
                fontWeight: 700,
                color: TEXT_PRI,
                margin: 0,
              }}>
                Meta de hoy
              </h2>
              <div style={{
                background: cardsStudiedToday >= dailyGoal ? SAGE : tokens.color.bgGrey,
                borderRadius: "8px",
                padding: "4px 10px",
                fontFamily: FONT_UI,
                fontSize: "12px",
                fontWeight: 700,
                color: cardsStudiedToday >= dailyGoal ? tokens.color.textSuccess : TEXT_SEC,
              }}>
                {progress}%
              </div>
            </div>

            <p style={{
              fontFamily: FONT_UI,
              fontSize: "12px",
              fontWeight: 400,
              color: TEXT_SEC,
              margin: "0 0 8px 0",
            }}>
              {cardsStudiedToday} / {dailyGoal} tarjetas
            </p>

            <p style={{
              fontFamily: FONT_UI,
              fontSize: "11px",
              fontWeight: 400,
              color: TEXT_SEC,
              margin: 0,
            }}>
              {cardsStudiedToday >= dailyGoal
                ? "¡Meta alcanzada! 🎉"
                : `Completa ${dailyGoal - cardsStudiedToday} más para mantener tu racha`}
            </p>
          </div>
        );
      })()}

      {/* Repasar CTA */}
      {needsStudy > 0 && (
        <button
          onClick={() => {
            const firstIncomplete = localSets.find(s => s.progress < 100);
            if (firstIncomplete) onStudy(firstIncomplete);
          }}
          aria-label={`Empezar a repasar ${needsStudy} tarjetas, tiempo estimado 2 minutos`}
          style={{
            background: TEXT_PRI,
            borderRadius: CARD_RADIUS,
            padding: "16px 20px",
            marginBottom: SECTION_GAP,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            border: "none",
            cursor: "pointer",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <h2 style={{
              fontFamily: FONT_UI,
              fontSize: "14px",
              fontWeight: 700,
              color: tokens.color.surface,
              margin: "0 0 2px 0",
            }}>
              {needsStudy} tarjetas por repasar
            </h2>
            <p style={{
              fontFamily: FONT_UI,
              fontSize: "11px",
              fontWeight: 400,
              color: TEXT_SEC,
              margin: 0,
            }}>
              Empieza ahora · ~2 min
            </p>
          </div>

          <div
            style={{
              background: ROSE,
              borderRadius: "20px",
              padding: "8px 16px",
              fontFamily: FONT_UI,
              fontSize: "12px",
              fontWeight: 700,
              color: TEXT_PRI,
              flexShrink: 0,
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            Repasar →
          </div>
        </button>
      )}

      {/* Mis sets Header */}
      {localSets.length > 0 && (
        <h2 style={{
          fontFamily: FONT_UI,
          fontSize: "20px",
          fontWeight: 700,
          color: TEXT_PRI,
          margin: "0 0 16px",
        }}>
          Mis sets
        </h2>
      )}

      {/* Sets List */}
      {localSets.length > 0 ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginBottom: "24px",
        }}>
          {sortedSets.map((set) => (
            <SetCard
              key={set.id}
              set={set}
              onStudy={() => onStudy(set)}
              onShare={() => handleShare(set.id)}
              onToggleFavorite={() => handleToggleFavorite(set.id)}
              onRename={() => handleRenameSet(set.id, set.title)}
              onDelete={() => handleDeleteSet(set.id)}
            />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: "center",
          padding: "40px 20px",
          background: W,
          borderRadius: CARD_RADIUS,
          border: `0.5px solid ${BORDER}`,
          marginBottom: "24px",
        }}>
          <p style={{
            fontFamily: FONT_UI,
            fontSize: "13px",
            color: TEXT_SEC,
            margin: 0,
          }}>
            Aún no tienes sets. ¡Crea uno para empezar!
          </p>
        </div>
      )}

      {/* Create new set button */}
      <button
        onClick={() => onNavigate("crear")}
        style={{
          width: "100%",
          background: TEXT_PRI,
          border: "none",
          borderRadius: "24px",
          padding: "14px 20px",
          fontFamily: FONT_UI,
          fontSize: "14px",
          fontWeight: 700,
          color: tokens.color.surface,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "24px",
        }}
      >
        + Crear nuevo set
      </button>
    </div>
  );

  // ===== Mobile Layout =====
  const mobileContent = (
    <div style={{
      height: "100dvh",
      maxWidth: "375px",
      margin: "0 auto",
      background: BG_PAGE,
      display: "flex",
      flexDirection: "column",
    }}>
      <div aria-hidden style={{
        flexShrink: 0,
        height: "max(16px, env(safe-area-inset-top, 0px))",
      }} />

      <div style={{
        flex: 1,
        overflowY: "scroll",
        WebkitOverflowScrolling: "touch",
        height: "0",
        paddingBottom: "100px",
      }}>
        {mainContent}
      </div>

      <nav style={{
        flexShrink: 0,
        width: "100%",
        background: "#fff",
        borderTop: `1px solid ${BORDER}`,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-around",
        paddingTop: "10px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px) + 8px)",
      }}>
        <NavItem label="Inicio" active icon={<HomeIcon />} onClick={() => {}} />
        <NavItem label="Crear" active={false} icon={<CreateIcon />} onClick={() => onNavigate("crear")} />
        <NavItem label="Progreso" active={false} icon={<PlayIcon />} onClick={() => onNavigate("progreso")} />
        <NavItem label="Perfil" active={false} icon={<PersonIcon />} onClick={() => onNavigate("perfil")} />
      </nav>

      <div aria-hidden style={{
        flexShrink: 0,
        background: "#fff",
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

  // ===== Desktop Layout =====
  const desktopContent = (
    <div style={{
      height: "100dvh",
      background: BG_PAGE,
      display: "flex",
      flexDirection: "row",
    }}>
      <AppSidebar activeTab="inicio" onNavigate={onNavigate} onLogout={onLogout} />

      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}>
        <div aria-hidden style={{
          flexShrink: 0,
          height: "max(16px, env(safe-area-inset-top, 0px))",
        }} />

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
            width: "100%",
          }}>
            {mainContent}
          </div>
        </div>
      </div>
    </div>
  );

  return isMobile ? mobileContent : desktopContent;
}

// ── SetCard ────────────────────────────────────────────────────────────────────
function SetCard({
  set,
  onStudy,
  onShare,
  onToggleFavorite,
  onRename,
  onDelete,
}: {
  set: DeckSet;
  onStudy: () => void;
  onShare: () => void;
  onToggleFavorite: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
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

  // Progress bar color
  let barColor = tokens.color.butter;
  let progressText = "Sin empezar";
  if (set.progress > 50) {
    barColor = tokens.color.sage;
    progressText = `${set.progress}%`;
  } else if (set.progress > 0) {
    barColor = tokens.color.butter;
    progressText = `${set.progress}%`;
  } else if (set.progress < 30 && set.progress > 0) {
    barColor = tokens.color.rose;
  }

  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      onClick={onStudy}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      style={{
        background: isPressed ? tokens.color.bgHover : tokens.color.surface,
        border: `0.5px solid ${BORDER}`,
        borderRadius: CARD_RADIUS,
        padding: "14px",
        cursor: "pointer",
        transform: isPressed ? "scale(0.98)" : "scale(1)",
        transition: "all 100ms ease",
      }}
    >
      {/* Title and Progress Badge */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "8px",
      }}>
        <h3 style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: "14px",
          fontWeight: 700,
          color: TEXT_PRI,
          margin: 0,
        }}>
          {set.title}
        </h3>
        {set.progress > 0 ? (
          <div style={{
            background: tokens.color.bgSageSoft,
            borderRadius: "8px",
            padding: "4px 10px",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "11px",
            fontWeight: 700,
            color: tokens.color.textSuccess,
          }}>
            {set.progress}%
          </div>
        ) : (
          <div style={{
            background: tokens.color.bgGrey,
            borderRadius: "8px",
            padding: "4px 10px",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "11px",
            fontWeight: 600,
            color: TEXT_SEC,
          }}>
            Sin empezar
          </div>
        )}
      </div>

      {/* Metadata */}
      <p style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: "11px",
        color: TEXT_SEC,
        margin: "0 0 10px 0",
      }}>
        {set.cardCount} tarjetas · {getTimeSinceStudied(set.lastStudied)}
      </p>

      {/* Action Row: Progress Bar + Share + Menu */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}>
        {/* Progress Bar (flex: 1) */}
        <div style={{
          flex: 1,
          position: "relative",
          width: "100%",
          height: "4px",
          borderRadius: "2px",
          background: BORDER,
        }}>
          <div style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${set.progress}%`,
            borderRadius: "2px",
            background: barColor,
          }} />
        </div>

        {/* Share button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            background: tokens.color.bgSkyLight,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: tokens.color.sky,
            flexShrink: 0,
          }}
          title="Compartir"
        >
          <Share2 style={{ width: "16px", height: "16px" }} />
        </button>

        {/* Menu button */}
        <div onClick={(e) => e.stopPropagation()}>
          <MenuButton onRename={onRename} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}

// ── MenuButton ────────────────────────────────────────────────────────────────────
function MenuButton({ onRename, onDelete }: { onRename: () => void; onDelete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "10px",
          background: tokens.color.bgSubtle,
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: TEXT_SEC,
        }}
        title="Más opciones"
      >
        <MoreVertical style={{ width: "16px", height: "16px" }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            left: 0,
            zIndex: 9999,
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              position: "absolute",
              right: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              background: tokens.color.surface,
              border: `1px solid ${BORDER}`,
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 10000,
              minWidth: "160px",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setIsOpen(false);
                onRename();
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "none",
                border: "none",
                textAlign: "left",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                fontSize: "13px",
                fontWeight: 500,
                color: TEXT_PRI,
                cursor: "pointer",
                borderBottom: `0.5px solid ${BORDER}`,
              }}
            >
              Renombrar
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onDelete();
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "none",
                border: "none",
                textAlign: "left",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                fontSize: "13px",
                fontWeight: 500,
                color: tokens.color.textError,
                cursor: "pointer",
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
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
        background: active ? tokens.color.navPill : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? TEXT_PRI : TEXT_SEC,
        transition: "width 0.15s ease",
      }}>
        {icon}
      </div>
      <span style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
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
function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CreateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.8" />
      <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 20c0-4.418 4.03-8 9-8s9 3.582 9 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
