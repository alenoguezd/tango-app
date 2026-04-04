"use client";

import { useEffect, useState } from "react";
import { Share2, MoreVertical, Home, Camera, BarChart3, User } from "lucide-react";
import { type VocabCard } from "@/components/flashcard";
import { createClient } from "@/lib/supabase";
import { tokens } from "@/lib/design-tokens";
import { getDueCards, getTodayString, type CardProgress } from "@/lib/sm2";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DeckSet {
  id: string;
  title: string;
  cardCount: number;
  progress: CardProgress[] | number;
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
const FONT_UI = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const TEXT_PRI = "#1A1A1A";
const TEXT_SEC = "#B0A898";
const SAGE = "#A8C87A";
const ROSE = "#F2B8CD";
const BUTTER = "#F5DC7A";
const BORDER = "#EEEBE6";
const BG_DARK = "#1A1A1A";
const BG_PAGE = "#F5F4F0"; // Warm off-white background
const SKY = tokens.color.sky;
const SKY_LIGHT = "#E3F2FD";

const EMOJI_ICONS = [
  { emoji: "🍜", label: "Comida" },
  { emoji: "🚇", label: "Transporte" },
  { emoji: "🏪", label: "Tienda" },
  { emoji: "👋", label: "Saludos" },
];

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

// ── HomeScreen ────────────────────────────────────────────────────────────────────
export function HomeScreen({ sets: propSets, recent, onContinue, onStudy, onNavigate, onLogout }: HomeScreenProps) {
  const [localSets, setLocalSets] = useState<DeckSet[]>(propSets || []);
  const [userName, setUserName] = useState<string>("Usuario");
  const [userInitials, setUserInitials] = useState<string>("U");
  const [userFirstName, setUserFirstName] = useState<string>("Usuario");
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
          const fullName = (user.user_metadata?.full_name as string) || "";
          const emailName = user.email?.split("@")[0] || "";
          const name = fullName || emailName;
          const displayName = name.charAt(0).toUpperCase() + name.slice(1);
          setUserName(displayName);
          setUserFirstName(name.split(" ")[0] || name);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Inicia sesión para compartir");
      return;
    }

    const shareToken = crypto.randomUUID();
    const { error } = await supabase
      .from("sets")
      .update({
        is_public: true,
        share_token: shareToken,
        shared_at: new Date().toISOString(),
      })
      .eq("id", setId)
      .eq("user_id", user.id);

    if (error) {
      showToast("Error al compartir");
      return;
    }

    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/estudiar/${shareToken}`;
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

  // Helper function to get due cards for a set
  const getDueCardsForSet = (progress: CardProgress[] | number | undefined, cardCount: number): CardProgress[] => {
    if (!Array.isArray(progress)) {
      return [];
    }
    if (progress.length === 0) {
      return Array.from({ length: cardCount }, (_, i) => ({
        cardId: i.toString(),
        known: false,
        interval: 1,
        easeFactor: 2.5,
        nextReview: getTodayString(),
        repetitions: 0,
      }));
    }
    return getDueCards(progress);
  };

  // Calculate stats including due cards
  const setStats = localSets.map((set) => {
    const progress = (set.progress || []) as CardProgress[];
    const dueCards = getDueCardsForSet(progress, set.cardCount);
    return {
      setId: set.id,
      dueCount: dueCards.length,
    };
  });

  const totalDueCards = setStats.reduce((sum, stat) => sum + stat.dueCount, 0);
  const totalCards = localSets.reduce((sum, s) => sum + s.cardCount, 0);
  const setsWithDue = setStats.filter(s => s.dueCount > 0).length;
  const avgMastery = localSets.length > 0
    ? Math.round(localSets.reduce((sum, s) => {
        const progress = (s.progress || []) as CardProgress[];
        return sum + (progress.length > 0 ? Math.round(
          (progress.filter((c) => c.known === true).length / progress.length) * 100
        ) : 0);
      }, 0) / localSets.length)
    : 0;

  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 1024;

  // Get first due set for "Estudiar" button
  const firstDueSet = localSets.find((set) => {
    const stat = setStats.find(s => s.setId === set.id);
    return stat && stat.dueCount > 0;
  });

  // ===== MOBILE LAYOUT =====
  if (isMobile) {
    return (
      <div style={{
        height: "100dvh",
        background: BG_PAGE,
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Top Safe Area */}
        <div aria-hidden style={{
          flexShrink: 0,
          height: "max(16px, env(safe-area-inset-top, 0px))",
        }} />

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflowY: "scroll",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "100px",
        }}>
          {/* Greeting */}
          <div style={{
            padding: "16px 16px 8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <h1 style={{
              fontFamily: FONT_UI,
              fontSize: "28px",
              fontWeight: 600,
              color: TEXT_SEC,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              おはよう,
              <span style={{
                fontSize: "28px",
                fontWeight: 700,
                color: SAGE,
              }}>
                {userFirstName}
              </span>
            </h1>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: ROSE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT_UI,
              fontSize: "16px",
              fontWeight: 700,
              color: "white",
            }}>
              {userInitials}
            </div>
          </div>

          {/* Streak */}
          <div style={{
            padding: "0 16px 16px",
            fontSize: "12px",
            color: TEXT_SEC,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <span style={{ color: "#F5A623", fontSize: "16px" }}>●</span>
            Viernes · racha de 7 días
          </div>

          {/* PARA HOY Banner */}
          <div style={{
            margin: "0 16px 24px",
            background: BG_DARK,
            borderRadius: "20px",
            padding: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <p style={{
                fontFamily: FONT_UI,
                fontSize: "11px",
                fontWeight: 700,
                color: SAGE,
                margin: 0,
                letterSpacing: "1px",
              }}>
                PARA HOY
              </p>
              <p style={{
                fontFamily: FONT_UI,
                fontSize: "36px",
                fontWeight: 800,
                color: "white",
                margin: "8px 0 4px 0",
                lineHeight: 1,
              }}>
                {totalDueCards}
              </p>
              <p style={{
                fontFamily: FONT_UI,
                fontSize: "12px",
                color: "#999",
                margin: 0,
              }}>
                tarjetas listas para repasar
              </p>
            </div>
            {firstDueSet && (
              <button
                onClick={() => onStudy(firstDueSet)}
                style={{
                  background: SAGE,
                  border: "none",
                  borderRadius: "50px",
                  padding: "12px 24px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: TEXT_PRI,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Estudiar →
              </button>
            )}
          </div>

          {/* Stats Pills */}
          <div style={{
            display: "flex",
            gap: "12px",
            padding: "0 16px 24px",
            overflow: "hidden",
          }}>
            <StatPill label="Tarjetas" value={totalCards} />
            <StatPill label="Dominadas" value={`${avgMastery}%`} />
            <StatPill label="Para hoy" value={setsWithDue} />
          </div>

          {/* Mis Sets Header */}
          {localSets.length > 0 && (
            <h2 style={{
              fontFamily: FONT_UI,
              fontSize: "18px",
              fontWeight: 700,
              color: TEXT_PRI,
              margin: "0 0 12px 16px",
            }}>
              Mis sets
            </h2>
          )}

          {/* Sets Grid */}
          {localSets.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              padding: "0 16px 24px",
            }}>
              {localSets.map((set) => {
                const dueCount = setStats.find((stat) => stat.setId === set.id)?.dueCount ?? 0;
                return (
                  <SetGridCard
                    key={set.id}
                    set={set}
                    dueCount={dueCount}
                    onStudy={() => onStudy(set)}
                    onShare={() => handleShare(set.id)}
                    onRename={() => handleRenameSet(set.id, set.title)}
                    onDelete={() => handleDeleteSet(set.id)}
                  />
                );
              })}
            </div>
          ) : null}

          {/* Descubrir Section */}
          <div style={{ padding: "0 16px 24px" }}>
            <h2 style={{
              fontFamily: FONT_UI,
              fontSize: "16px",
              fontWeight: 700,
              color: TEXT_PRI,
              margin: "0 0 12px 0",
            }}>
              Descubrir
            </h2>
            <div style={{
              display: "flex",
              gap: "12px",
              overflowX: "auto",
              paddingBottom: "8px",
              WebkitOverflowScrolling: "touch",
            }}>
              {[
                { emoji: "👋", name: "Saludos básicos", count: 20, tag: "Esencial", tagColor: SKY_LIGHT, tagTextColor: SKY },
                { emoji: "🍱", name: "En el restaurante", count: 28, tag: "Viaje", tagColor: ROSE, tagTextColor: "white" },
                { emoji: "🏨", name: "Hotel y alojamiento", count: 22, tag: "Viaje", tagColor: ROSE, tagTextColor: "white" },
                { emoji: "🔢", name: "Números y precios", count: 15, tag: "Esencial", tagColor: SKY_LIGHT, tagTextColor: SKY },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    minWidth: "140px",
                    background: "white",
                    border: `0.5px solid ${BORDER}`,
                    borderRadius: "12px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <p style={{ fontSize: "24px", margin: 0 }}>{item.emoji}</p>
                  <p style={{
                    fontFamily: FONT_UI,
                    fontSize: "12px",
                    fontWeight: 700,
                    color: TEXT_PRI,
                    margin: 0,
                  }}>
                    {item.name}
                  </p>
                  <p style={{
                    fontFamily: FONT_UI,
                    fontSize: "10px",
                    color: TEXT_SEC,
                    margin: 0,
                  }}>
                    {item.count} tarjetas
                  </p>
                  <div style={{
                    background: item.tagColor,
                    color: item.tagTextColor,
                    borderRadius: "6px",
                    padding: "2px 8px",
                    fontSize: "9px",
                    fontWeight: 600,
                    width: "fit-content",
                  }}>
                    {item.tag}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Nav */}
        <nav style={{
          flexShrink: 0,
          width: "100%",
          background: "white",
          borderTop: `1px solid ${BORDER}`,
          display: "flex",
          justifyContent: "space-around",
          paddingTop: "8px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px) + 8px)",
        }}>
          <NavIconItem icon={Home} label="Inicio" active onClick={() => {}} />
          <NavIconItem icon={Camera} label="Crear" active={false} onClick={() => onNavigate("crear")} />
          <NavIconItem icon={BarChart3} label="Progreso" active={false} onClick={() => onNavigate("progreso")} />
          <NavIconItem icon={User} label="Perfil" active={false} onClick={() => {}} />
        </nav>

        {/* Bottom Safe Area */}
        <div aria-hidden style={{
          flexShrink: 0,
          background: "white",
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

        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: TEXT_PRI,
            color: "white",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            zIndex: 9999,
          }}>
            {toast}
          </div>
        )}
      </div>
    );
  }

  // ===== DESKTOP LAYOUT =====
  return (
    <div style={{
      minHeight: "100dvh",
      background: BG_PAGE,
      padding: "40px",
      maxWidth: "1280px",
      margin: "0 auto",
    }}>
      {/* Greeting */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "32px",
      }}>
        <h1 style={{
          fontFamily: FONT_UI,
          fontSize: "30px",
          fontWeight: 600,
          color: TEXT_SEC,
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          おはよう,
          <span style={{
            fontSize: "30px",
            fontWeight: 700,
            color: SAGE,
          }}>
            {userFirstName}
          </span>
        </h1>
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: ROSE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT_UI,
          fontSize: "20px",
          fontWeight: 700,
          color: "white",
        }}>
          {userInitials}
        </div>
      </div>

      {/* Streak */}
      <div style={{
        fontSize: "13px",
        color: TEXT_SEC,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "32px",
      }}>
        <span style={{ color: "#F5A623", fontSize: "16px" }}>●</span>
        Viernes · racha de 7 días
      </div>

      {/* PARA HOY Banner */}
      <div style={{
        background: BG_DARK,
        borderRadius: "24px",
        padding: "32px",
        marginBottom: "32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <p style={{
            fontFamily: FONT_UI,
            fontSize: "12px",
            fontWeight: 700,
            color: SAGE,
            margin: "0 0 12px 0",
            letterSpacing: "1px",
          }}>
            PARA HOY
          </p>
          <p style={{
            fontFamily: FONT_UI,
            fontSize: "48px",
            fontWeight: 800,
            color: "white",
            margin: "0 0 8px 0",
            lineHeight: 1,
          }}>
            {totalDueCards}
          </p>
          <p style={{
            fontFamily: FONT_UI,
            fontSize: "13px",
            color: "#999",
            margin: 0,
          }}>
            tarjetas listas para repasar
          </p>
        </div>
        {firstDueSet && (
          <button
            onClick={() => onStudy(firstDueSet)}
            style={{
              background: SAGE,
              border: "none",
              borderRadius: "50px",
              padding: "14px 32px",
              fontSize: "14px",
              fontWeight: 700,
              color: TEXT_PRI,
              cursor: "pointer",
            }}
          >
            Estudiar →
          </button>
        )}
      </div>

      {/* Stats Pills */}
      <div style={{
        display: "flex",
        gap: "16px",
        marginBottom: "32px",
      }}>
        <StatPill label="Tarjetas" value={totalCards} />
        <StatPill label="Dominadas" value={`${avgMastery}%`} />
        <StatPill label="Para hoy" value={setsWithDue} />
      </div>

      {/* Mis Sets Header */}
      {localSets.length > 0 && (
        <h2 style={{
          fontFamily: FONT_UI,
          fontSize: "20px",
          fontWeight: 700,
          color: TEXT_PRI,
          margin: "0 0 20px 0",
        }}>
          Mis sets
        </h2>
      )}

      {/* Sets Grid */}
      {localSets.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "20px",
          marginBottom: "40px",
        }}>
          {localSets.map((set) => {
            const dueCount = setStats.find((stat) => stat.setId === set.id)?.dueCount ?? 0;
            return (
              <SetGridCard
                key={set.id}
                set={set}
                dueCount={dueCount}
                onStudy={() => onStudy(set)}
                onShare={() => handleShare(set.id)}
                onRename={() => handleRenameSet(set.id, set.title)}
                onDelete={() => handleDeleteSet(set.id)}
              />
            );
          })}
        </div>
      ) : null}

      {/* Descubrir Section */}
      <h2 style={{
        fontFamily: FONT_UI,
        fontSize: "20px",
        fontWeight: 700,
        color: TEXT_PRI,
        margin: "0 0 20px 0",
      }}>
        Descubrir
      </h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "20px",
      }}>
        {[
          { emoji: "👋", name: "Saludos básicos", count: 20, tag: "Esencial", tagColor: SKY_LIGHT, tagTextColor: SKY },
          { emoji: "🍱", name: "En el restaurante", count: 28, tag: "Viaje", tagColor: ROSE, tagTextColor: "white" },
          { emoji: "🏨", name: "Hotel y alojamiento", count: 22, tag: "Viaje", tagColor: ROSE, tagTextColor: "white" },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: "white",
              border: `0.5px solid ${BORDER}`,
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <p style={{ fontSize: "40px", margin: 0 }}>{item.emoji}</p>
            <p style={{
              fontFamily: FONT_UI,
              fontSize: "15px",
              fontWeight: 700,
              color: TEXT_PRI,
              margin: 0,
            }}>
              {item.name}
            </p>
            <p style={{
              fontFamily: FONT_UI,
              fontSize: "12px",
              color: TEXT_SEC,
              margin: 0,
            }}>
              {item.count} tarjetas
            </p>
            <div style={{
              background: item.tagColor,
              color: item.tagTextColor,
              borderRadius: "8px",
              padding: "4px 12px",
              fontSize: "11px",
              fontWeight: 600,
              width: "fit-content",
            }}>
              {item.tag}
            </div>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          background: TEXT_PRI,
          color: "white",
          padding: "14px 24px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 600,
          zIndex: 9999,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Stat Pill Component ────────────────────────────────────────────────────────
function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{
      flex: 1,
      background: "white",
      border: `0.5px solid ${BORDER}`,
      borderRadius: "12px",
      padding: "16px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <p style={{
        fontFamily: FONT_UI,
        fontSize: "20px",
        fontWeight: 500,
        color: "#1A1A1A",
        margin: 0,
        lineHeight: 1,
      }}>
        {value}
      </p>
      <p style={{
        fontFamily: FONT_UI,
        fontSize: "11px",
        color: "#B0A898",
        margin: 0,
        textTransform: "capitalize",
      }}>
        {label}
      </p>
    </div>
  );
}

// ── Set Grid Card Component ────────────────────────────────────────────────────
function SetGridCard({
  set,
  dueCount,
  onStudy,
  onShare,
  onRename,
  onDelete,
}: {
  set: DeckSet;
  dueCount: number;
  onStudy: () => void;
  onShare: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [isPressed, setIsPressed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const progress = (set.progress || []) as CardProgress[];
  const knownCount = Array.isArray(progress) ? progress.filter((c) => c.known === true).length : 0;
  const progressPercent = set.cardCount > 0 ? Math.round((knownCount / set.cardCount) * 100) : 0;

  return (
    <div
      onClick={onStudy}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      style={{
        position: "relative",
        background: isPressed ? "#F0F0F0" : "white",
        border: `0.5px solid ${BORDER}`,
        borderRadius: "16px",
        padding: "16px",
        cursor: "pointer",
        transform: isPressed ? "scale(0.98)" : "scale(1)",
        transition: "all 100ms ease",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Due Chip - Absolute positioned top-right */}
      <div style={{
        position: "absolute",
        top: "12px",
        right: "12px",
        background: dueCount > 0 ? BUTTER : "#D4EDBA",
        borderRadius: "8px",
        padding: "4px 10px",
        fontSize: "10px",
        fontWeight: 700,
        color: "#1A1A1A",
      }}>
        {dueCount > 0 ? `${dueCount} due` : "Al día ✓"}
      </div>

      {/* Icon */}
      <div style={{
        fontSize: "20px",
        width: "40px",
        height: "40px",
        background: dueCount > 0 ? "#FFE5CC" : "#E8F5E9",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        {["🍜", "🚇", "🏪", "👋"][Math.floor(Math.random() * 4)]}
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: FONT_UI,
        fontSize: "14px",
        fontWeight: 700,
        color: "#1A1A1A",
        margin: 0,
      }}>
        {set.title}
      </h3>

      {/* Card Count */}
      <p style={{
        fontFamily: FONT_UI,
        fontSize: "11px",
        color: "#B0A898",
        margin: 0,
      }}>
        {set.cardCount} tarjetas
      </p>

      {/* Progress Bar */}
      <div style={{
        height: "4px",
        background: "#EEEBE6",
        borderRadius: "2px",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${progressPercent}%`,
          background: progressPercent > 50 ? "#A8C87A" : progressPercent > 0 ? "#F5DC7A" : "#EEEBE6",
          transition: "width 200ms ease",
        }} />
      </div>

      {/* Menu Button - Top Right (below due chip) */}
      <div style={{
        position: "absolute",
        top: "48px",
        right: "12px",
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: "#F0F0F0",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#B0A898",
            padding: 0,
          }}
          title="Más opciones"
        >
          <MoreVertical style={{ width: "14px", height: "14px" }} />
        </button>

        {menuOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
            }}
            onClick={() => setMenuOpen(false)}
          >
            <div
              style={{
                position: "absolute",
                right: "0",
                bottom: "40px",
                background: "white",
                border: `0.5px solid ${BORDER}`,
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                zIndex: 10000,
                minWidth: "140px",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onRename();
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  fontFamily: FONT_UI,
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#1A1A1A",
                  cursor: "pointer",
                  borderBottom: `0.5px solid ${BORDER}`,
                }}
              >
                Renombrar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete();
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  fontFamily: FONT_UI,
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#E74C3C",
                  cursor: "pointer",
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Nav Icon Item Component ────────────────────────────────────────────────────
function NavIconItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ width: number; height: number }>;
  label: string;
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
        gap: "4px",
        minHeight: "48px",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0",
      }}
    >
      <Icon width={20} height={20} color={active ? "#1A1A1A" : "#B0A898"} />
      <span style={{
        fontFamily: FONT_UI,
        fontSize: "10px",
        fontWeight: active ? 700 : 400,
        color: active ? "#1A1A1A" : "#B0A898",
      }}>
        {label}
      </span>
    </button>
  );
}
