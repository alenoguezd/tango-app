"use client";

import { useEffect, useState } from "react";
import { MoreVertical } from "lucide-react";
import { type VocabCard } from "@/components/flashcard";
import { createClient } from "@/lib/supabase";
import { tokens } from "@/lib/design-tokens";
import { getDueCards, getTodayString, type CardProgress } from "@/lib/sm2";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { BottomNav } from "@/components/bottom-nav";
import { PageTitle } from "@/components/ui/page-title";
import { StatPill } from "@/components/ui/stat-pill";
import { Avatar } from "@/components/ui/avatar";

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

// ── Pastel colors array (from tokens) ────────────────────────────────────────
const PASTEL_COLORS = [
  tokens.color.pastel.pink,
  tokens.color.pastel.blue,
  tokens.color.pastel.green,
  tokens.color.pastel.peach,
  tokens.color.pastel.purple,
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

  const handleResetProgress = async (setId: string) => {
    if (confirm("¿Reiniciar el progreso de este set? Todas las tarjetas volverán a estar disponibles para estudiar.")) {
      setLocalSets((prev) => {
        const updated = prev.map((set) =>
          set.id === setId ? { ...set, progress: [] } : set
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
            .update({ progress: [] })
            .eq("id", setId)
            .eq("user_id", user.id);
          showToast("Progreso reiniciado");
        }
      } catch (err) {
        console.error("[Reset Progress] Error:", err);
        showToast("Error al reiniciar el progreso");
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
        maxWidth: "375px",
        margin: "0 auto",
        background: tokens.color.page,
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
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          height: "0",
          paddingBottom: "100px",
        }}>
          {/* Greeting */}
          <div style={{
            padding: tokens.spacing["4"],
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <h1 style={{
              fontFamily: tokens.typography.family.ui,
              fontSize: tokens.typography.size["3xl"],
              fontWeight: tokens.typography.weight.medium,
              lineHeight: tokens.typography.lineHeight.tight,
              color: tokens.color.muted,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: tokens.spacing["2"],
            }}>
              おはよう,
              <span style={{
                fontSize: tokens.typography.size["3xl"],
                fontWeight: tokens.typography.weight.bold,
                color: tokens.color.sage,
              }}>
                {userFirstName}
              </span>
            </h1>
            <Avatar initials={userInitials} size={48} backgroundColor={tokens.color.rose} />
          </div>

          {/* Streak */}
          <div style={{
            padding: `0 ${tokens.spacing["4"]} ${tokens.spacing["3"]}`,
            fontSize: tokens.typography.size.sm,
            fontWeight: tokens.typography.weight.regular,
            lineHeight: tokens.typography.lineHeight.normal,
            color: tokens.color.muted,
            display: "flex",
            alignItems: "center",
            gap: tokens.spacing["2"],
          }}>
            <span style={{ color: tokens.color.orange, fontSize: tokens.typography.size.lg }}>●</span>
            Viernes · racha de 7 días
          </div>

          {/* PARA HOY Banner */}
          <div style={{
            margin: `0 ${tokens.spacing["4"]} ${tokens.spacing["6"]}`,
            background: tokens.color.ink,
            borderRadius: "20px",
            padding: tokens.spacing["5"],
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <p style={{
                fontFamily: tokens.typography.family.ui,
                fontSize: "11px",
                fontWeight: 700,
                color: tokens.color.sage,
                margin: 0,
                letterSpacing: "1px",
              }}>
                PARA HOY
              </p>
              <p style={{
                fontFamily: tokens.typography.family.ui,
                fontSize: "36px",
                fontWeight: 800,
                color: "white",
                margin: `${tokens.spacing["2"]} 0 ${tokens.spacing["1"]} 0`,
                lineHeight: 1,
              }}>
                {totalDueCards}
              </p>
              <p style={{
                fontFamily: tokens.typography.family.ui,
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
                  background: tokens.color.sage,
                  border: "none",
                  borderRadius: "50px",
                  padding: `${tokens.spacing["3"]} ${tokens.spacing["6"]}`,
                  fontSize: "12px",
                  fontWeight: 700,
                  color: tokens.color.ink,
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
            gap: tokens.spacing["2"],
            padding: `0 ${tokens.spacing["4"]} ${tokens.spacing["6"]}`,
            overflow: "hidden",
          }}>
            <StatPill label="Tarjetas" value={totalCards} />
            <StatPill label="Dominadas" value={`${avgMastery}%`} />
            <StatPill label="Para hoy" value={setsWithDue} />
          </div>

          {/* Mis Sets Header */}
          {localSets.length > 0 && (
            <h2 style={{
              fontFamily: tokens.typography.family.ui,
              fontSize: "18px",
              fontWeight: 700,
              color: tokens.color.ink,
              margin: 0,
              padding: `0 ${tokens.spacing["4"]} ${tokens.spacing["3"]}`,
            }}>
              Mis sets
            </h2>
          )}

          {/* Sets Grid */}
          {localSets.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: tokens.spacing["2"],
              padding: `0 ${tokens.spacing["4"]} ${tokens.spacing["6"]}`,
            }}>
              {localSets.map((set, index) => {
                const dueCount = setStats.find((stat) => stat.setId === set.id)?.dueCount ?? 0;
                return (
                  <SetGridCard
                    key={set.id}
                    set={set}
                    dueCount={dueCount}
                    index={index}
                    onStudy={() => onStudy(set)}
                    onShare={() => handleShare(set.id)}
                    onRename={() => handleRenameSet(set.id, set.title)}
                    onDelete={() => handleDeleteSet(set.id)}
                    onToggleFavorite={() => handleToggleFavorite(set.id)}
                    onResetProgress={() => handleResetProgress(set.id)}
                  />
                );
              })}
            </div>
          ) : null}

          {/* Descubrir Section */}
          <div style={{ padding: `0 ${tokens.spacing["4"]} ${tokens.spacing["6"]}` }}>
            <h2 style={{
              fontFamily: tokens.typography.family.ui,
              fontSize: "16px",
              fontWeight: 700,
              color: tokens.color.ink,
              margin: `0 0 ${tokens.spacing["3"]} 0`,
              paddingLeft: 0,
            }}>
              Descubrir
            </h2>
            <div style={{
              display: "flex",
              gap: tokens.spacing["3"],
              overflowX: "auto",
              paddingBottom: "8px",
              WebkitOverflowScrolling: "touch",
            }}>
              {[
                { emoji: "👋", name: "Saludos básicos", count: 20, tag: "Esencial", tagColor: tokens.color.sky_LIGHT, tagTextColor: tokens.color.sky },
                { emoji: "🍱", name: "En el restaurante", count: 28, tag: "Viaje", tagColor: tokens.color.rose, tagTextColor: "white" },
                { emoji: "🏨", name: "Hotel y alojamiento", count: 22, tag: "Viaje", tagColor: tokens.color.rose, tagTextColor: "white" },
                { emoji: "🔢", name: "Números y precios", count: 15, tag: "Esencial", tagColor: tokens.color.sky_LIGHT, tagTextColor: tokens.color.sky },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    minWidth: "140px",
                    background: "white",
                    border: `0.5px solid ${tokens.color.border}`,
                    borderRadius: "12px",
                    padding: tokens.spacing["3"],
                    display: "flex",
                    flexDirection: "column",
                    gap: tokens.spacing["2"],
                  }}
                >
                  <p style={{ fontSize: "24px", margin: 0 }}>{item.emoji}</p>
                  <p style={{
                    fontFamily: tokens.typography.family.ui,
                    fontSize: "12px",
                    fontWeight: 700,
                    color: tokens.color.ink,
                    margin: 0,
                  }}>
                    {item.name}
                  </p>
                  <p style={{
                    fontFamily: tokens.typography.family.ui,
                    fontSize: "10px",
                    color: tokens.color.muted,
                    margin: 0,
                  }}>
                    {item.count} tarjetas
                  </p>
                  <div style={{
                    background: item.tagColor,
                    color: item.tagTextColor,
                    borderRadius: "6px",
                    padding: `${tokens.spacing["1"]} ${tokens.spacing["2"]}`,
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
        <BottomNav active="inicio" onNavigate={onNavigate} />

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
            background: tokens.color.ink,
            color: "white",
            padding: `${tokens.spacing["3"]} ${tokens.spacing["5"]}`,
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
      background: tokens.color.page,
      padding: tokens.spacing["10"],
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
          fontFamily: tokens.typography.family.ui,
          fontSize: "30px",
          fontWeight: 600,
          color: tokens.color.muted,
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: tokens.spacing["2"],
        }}>
          おはよう,
          <span style={{
            fontSize: "30px",
            fontWeight: 700,
            color: tokens.color.sage,
          }}>
            {userFirstName}
          </span>
        </h1>
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: tokens.color.rose,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: tokens.typography.family.ui,
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
        color: tokens.color.muted,
        display: "flex",
        alignItems: "center",
        gap: tokens.spacing["2"],
        marginBottom: "32px",
      }}>
        <span style={{ color: "#F5A623", fontSize: "16px" }}>●</span>
        Viernes · racha de 7 días
      </div>

      {/* PARA HOY Banner */}
      <div style={{
        background: tokens.color.ink,
        borderRadius: "24px",
        padding: tokens.spacing["8"],
        marginBottom: "32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <p style={{
            fontFamily: tokens.typography.family.ui,
            fontSize: "12px",
            fontWeight: 700,
            color: tokens.color.sage,
            margin: `0 0 ${tokens.spacing["3"]} 0`,
            letterSpacing: "1px",
          }}>
            PARA HOY
          </p>
          <p style={{
            fontFamily: tokens.typography.family.ui,
            fontSize: "48px",
            fontWeight: 800,
            color: "white",
            margin: `0 0 ${tokens.spacing["2"]} 0`,
            lineHeight: 1,
          }}>
            {totalDueCards}
          </p>
          <p style={{
            fontFamily: tokens.typography.family.ui,
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
              background: tokens.color.sage,
              border: "none",
              borderRadius: "50px",
              padding: `${tokens.spacing["3"]} ${tokens.spacing["8"]}`,
              fontSize: "14px",
              fontWeight: 700,
              color: tokens.color.ink,
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
        gap: tokens.spacing["4"],
        marginBottom: "32px",
      }}>
        <StatPill label="Tarjetas" value={totalCards} />
        <StatPill label="Dominadas" value={`${avgMastery}%`} />
        <StatPill label="Para hoy" value={setsWithDue} />
      </div>

      {/* Mis Sets Header */}
      {localSets.length > 0 && (
        <h2 style={{
          fontFamily: tokens.typography.family.ui,
          fontSize: "20px",
          fontWeight: 700,
          color: tokens.color.ink,
          margin: `0 0 ${tokens.spacing["5"]} 0`,
        }}>
          Mis sets
        </h2>
      )}

      {/* Sets Grid */}
      {localSets.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: tokens.spacing["5"],
          marginBottom: "40px",
        }}>
          {localSets.map((set, index) => {
            const dueCount = setStats.find((stat) => stat.setId === set.id)?.dueCount ?? 0;
            return (
              <SetGridCard
                key={set.id}
                set={set}
                dueCount={dueCount}
                index={index}
                onStudy={() => onStudy(set)}
                onShare={() => handleShare(set.id)}
                onRename={() => handleRenameSet(set.id, set.title)}
                onDelete={() => handleDeleteSet(set.id)}
                onToggleFavorite={() => handleToggleFavorite(set.id)}
                onResetProgress={() => handleResetProgress(set.id)}
              />
            );
          })}
        </div>
      ) : null}

      {/* Descubrir Section */}
      <h2 style={{
        fontFamily: tokens.typography.family.ui,
        fontSize: "20px",
        fontWeight: 700,
        color: tokens.color.ink,
        margin: `0 0 ${tokens.spacing["5"]} 0`,
      }}>
        Descubrir
      </h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: tokens.spacing["5"],
      }}>
        {[
          { emoji: "👋", name: "Saludos básicos", count: 20, tag: "Esencial", tagColor: tokens.color.sky_LIGHT, tagTextColor: tokens.color.sky },
          { emoji: "🍱", name: "En el restaurante", count: 28, tag: "Viaje", tagColor: tokens.color.rose, tagTextColor: "white" },
          { emoji: "🏨", name: "Hotel y alojamiento", count: 22, tag: "Viaje", tagColor: tokens.color.rose, tagTextColor: "white" },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: "white",
              border: `0.5px solid ${tokens.color.border}`,
              borderRadius: "16px",
              padding: tokens.spacing["5"],
              display: "flex",
              flexDirection: "column",
              gap: tokens.spacing["3"],
            }}
          >
            <p style={{ fontSize: "40px", margin: 0 }}>{item.emoji}</p>
            <p style={{
              fontFamily: tokens.typography.family.ui,
              fontSize: "15px",
              fontWeight: 700,
              color: tokens.color.ink,
              margin: 0,
            }}>
              {item.name}
            </p>
            <p style={{
              fontFamily: tokens.typography.family.ui,
              fontSize: "12px",
              color: tokens.color.muted,
              margin: 0,
            }}>
              {item.count} tarjetas
            </p>
            <div style={{
              background: item.tagColor,
              color: item.tagTextColor,
              borderRadius: "8px",
              padding: `${tokens.spacing["1"]} ${tokens.spacing["3"]}`,
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
          background: tokens.color.ink,
          color: "white",
          padding: `${tokens.spacing["3"]} ${tokens.spacing["6"]}`,
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
// ── Set Grid Card Component ────────────────────────────────────────────────────
function SetGridCard({
  set,
  dueCount,
  index,
  onStudy,
  onShare,
  onRename,
  onDelete,
  onToggleFavorite,
  onResetProgress,
}: {
  set: DeckSet;
  dueCount: number;
  index: number;
  onStudy: () => void;
  onShare: () => void;
  onRename: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onResetProgress: () => void;
}) {
  const [isPressed, setIsPressed] = useState(false);

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
        border: `0.5px solid ${tokens.color.border}`,
        borderRadius: "16px",
        padding: tokens.spacing["4"],
        cursor: "pointer",
        transform: isPressed ? "scale(0.98)" : "scale(1)",
        transition: "all 100ms ease",
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacing["3"],
      }}
    >
      {/* Due Chip - Absolute positioned top-right */}
      <div style={{
        position: "absolute",
        top: "12px",
        right: "12px",
        background: dueCount > 0 ? tokens.color.butter : "#D4EDBA",
        borderRadius: "8px",
        padding: `${tokens.spacing["1"]} ${tokens.spacing["2"]}`,
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
        background: PASTEL_COLORS[index % 5],
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
        fontFamily: tokens.typography.family.ui,
        fontSize: "14px",
        fontWeight: 700,
        color: "#1A1A1A",
        margin: 0,
      }}>
        {set.title}
      </h3>

      {/* Card Count */}
      <p style={{
        fontFamily: tokens.typography.family.ui,
        fontSize: "11px",
        color: tokens.color.muted,
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

      {/* Menu Button - Bottom Right */}
      <div style={{
        position: "absolute",
        bottom: "12px",
        right: "12px",
      }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              style={{
                minWidth: "44px",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "none",
                background: "none",
                padding: 0,
              }}
              title="Más opciones"
            >
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "#F0F0F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: tokens.color.muted,
              }}>
                <MoreVertical style={{ width: "14px", height: "14px" }} />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onStudy();
              }}
            >
              Estudiar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
            >
              Renombrar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              {set.favorite ? "Quitar de favoritos" : "Favorito"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
            >
              Compartir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onResetProgress();
              }}
            >
              Reiniciar progreso
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={{ color: "#E74C3C" }}
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

