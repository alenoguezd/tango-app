"use client";

import { useEffect, useState } from "react";
import { MoreVertical, Settings, Flame } from "lucide-react";
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
import { AppNav } from "@/components/app-nav";
import { PageTitle } from "@/components/ui/page-title";
import { StatPill } from "@/components/ui/stat-pill";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      <div className="h-screen max-w-[390px] mx-auto flex flex-col" style={{ background: tokens.color.page }}>
        {/* Top Safe Area */}
        <div aria-hidden className="flex-shrink-0 h-[max(16px,env(safe-area-inset-top,0px))]" />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch] pb-[100px]">
          {/* Greeting */}
          <div className="px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold leading-tight" style={{ color: tokens.color.ink }}>
              Hi, {userFirstName}
            </h1>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label="Configuración"
            >
              <Settings size={16} />
            </Button>
          </div>

          {/* Streak */}
          <div className="px-4 pb-3 flex items-center gap-2 text-sm font-normal leading-normal" style={{ color: tokens.color.muted }}>
            <Flame size={16} style={{ color: tokens.color.orange }} />
            <span>Racha de 7 días</span>
          </div>

          {/* Today Card */}
          <div className="mx-4 mb-6 rounded-lg p-5 text-white" style={{ background: tokens.color.ink }}>
            <div className="mb-4">
              <p className="text-xs font-semibold" style={{ color: tokens.color.muted }}>
                Today
              </p>
              <p className="text-4xl font-bold leading-none mt-1">
                {totalDueCards}
              </p>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${totalCards > 0 ? (totalDueCards / totalCards) * 100 : 0}%`,
                  background: tokens.color.butter,
                }}
              />
            </div>
          </div>

          {/* Stats Pills */}
          <div className="flex gap-2 px-4 mb-6 overflow-hidden">
            <StatPill label="Tarjetas" value={totalCards} />
            <StatPill label="Dominadas" value={`${avgMastery}%`} />
            <StatPill label="Para hoy" value={setsWithDue} />
          </div>

          {/* Sets Header */}
          {localSets.length > 0 && (
            <div className="px-4 pb-3 flex justify-between items-center">
              <h2 className="text-lg font-bold leading-tight" style={{ color: tokens.color.ink, margin: 0 }}>
                Sets
              </h2>
              <Button variant="ghost" size="sm" className="text-xs">
                See all
              </Button>
            </div>
          )}

          {/* Sets Grid */}
          {localSets.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 px-4 mb-6">
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
          <div className="px-4 mb-6">
            <h2 className="text-base font-bold mb-3" style={{ color: tokens.color.ink }}>
              Descubrir
            </h2>
            <div className="flex gap-3 overflow-x-auto [-webkit-overflow-scrolling:touch] pb-2">
              {[
                { emoji: "👋", name: "Saludos básicos", count: 20, tag: "Esencial", tagBg: tokens.color.bgSkyLight, tagText: tokens.color.sky },
                { emoji: "🍱", name: "En el restaurante", count: 28, tag: "Viaje", tagBg: tokens.color.rose, tagText: "white" },
                { emoji: "🏨", name: "Hotel y alojamiento", count: 22, tag: "Viaje", tagBg: tokens.color.rose, tagText: "white" },
                { emoji: "🔢", name: "Números y precios", count: 15, tag: "Esencial", tagBg: tokens.color.bgSkyLight, tagText: tokens.color.sky },
              ].map((item, i) => (
                <div
                  key={i}
                  className="min-w-[140px] bg-white border rounded-lg p-3 flex flex-col gap-2"
                  style={{ borderColor: tokens.color.border }}
                >
                  <p className="text-2xl m-0">{item.emoji}</p>
                  <p className="text-xs font-bold m-0" style={{ color: tokens.color.ink }}>
                    {item.name}
                  </p>
                  <p className="text-[10px] m-0" style={{ color: tokens.color.muted }}>
                    {item.count} tarjetas
                  </p>
                  <div
                    className="rounded-xs px-2 py-1 text-[9px] font-semibold w-fit"
                    style={{ background: item.tagBg, color: item.tagText }}
                  >
                    {item.tag}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <AppNav active="inicio" onNavigate={onNavigate} />

        {/* Bottom Safe Area */}
        <div aria-hidden className="flex-shrink-0 bg-white flex justify-center pt-1" style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom, 6px))" }}>
          <div className="w-[134px] h-1 rounded-full" style={{ background: "#111" }} />
        </div>

        {/* Toast */}
        {toast && (
          <div
            className="fixed bottom-[80px] left-1/2 -translate-x-1/2 text-white px-5 py-3 rounded-lg text-xs font-semibold z-[9999]"
            style={{ background: tokens.color.ink }}
          >
            {toast}
          </div>
        )}
      </div>
    );
  }

  // ===== DESKTOP LAYOUT =====
  return (
    <div className="flex min-h-screen" style={{ background: tokens.color.page }}>
      {/* Sidebar Navigation */}
      <AppNav active="inicio" onNavigate={onNavigate} />

      {/* Main Content */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0" />
      <main className="flex-1 lg:pt-8 lg:pb-6 lg:px-10 p-10 max-w-5xl">

      {/* Greeting */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold flex items-center gap-2 m-0" style={{ color: tokens.color.muted }}>
          Hi,
          <span className="font-bold" style={{ color: tokens.color.sage }}>
            {userFirstName}
          </span>
        </h1>
        <Button variant="outline" size="icon" className="rounded-full">
          <Settings size={20} />
        </Button>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-2 mb-8 text-sm" style={{ color: tokens.color.muted }}>
        <Flame size={16} style={{ color: tokens.color.orange }} />
        <span>Racha de 7 días</span>
      </div>

      {/* Today Card */}
      <div className="rounded-2xl p-8 mb-8 text-white" style={{ background: tokens.color.ink }}>
        <div className="mb-6">
          <p className="text-xs font-bold" style={{ color: tokens.color.muted }}>
            Today
          </p>
          <p className="text-6xl font-bold leading-none mt-2">
            {totalDueCards}
          </p>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${totalCards > 0 ? (totalDueCards / totalCards) * 100 : 0}%`,
              background: tokens.color.butter,
            }}
          />
        </div>
      </div>

      {/* Stats Pills */}
      <div className="flex gap-4 mb-8">
        <StatPill label="Tarjetas" value={totalCards} />
        <StatPill label="Dominadas" value={`${avgMastery}%`} />
        <StatPill label="Para hoy" value={setsWithDue} />
      </div>

      {/* Sets Header */}
      {localSets.length > 0 && (
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold m-0" style={{ color: tokens.color.ink }}>
            Sets
          </h2>
          <Button variant="ghost" size="sm" className="text-sm">
            See all
          </Button>
        </div>
      )}

      {/* Sets Grid */}
      {localSets.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 mb-10">
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
      <h2 className="text-xl font-bold mb-5" style={{ color: tokens.color.ink }}>
        Descubrir
      </h2>
      <div className="grid grid-cols-3 gap-5">
        {[
          { emoji: "👋", name: "Saludos básicos", count: 20, tag: "Esencial", tagBg: tokens.color.bgSkyLight, tagText: tokens.color.sky },
          { emoji: "🍱", name: "En el restaurante", count: 28, tag: "Viaje", tagBg: tokens.color.rose, tagText: "white" },
          { emoji: "🏨", name: "Hotel y alojamiento", count: 22, tag: "Viaje", tagBg: tokens.color.rose, tagText: "white" },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 flex flex-col gap-3"
            style={{ border: `0.5px solid ${tokens.color.border}` }}
          >
            <p className="text-4xl m-0">{item.emoji}</p>
            <p className="text-base font-bold m-0" style={{ color: tokens.color.ink }}>
              {item.name}
            </p>
            <p className="text-xs m-0" style={{ color: tokens.color.muted }}>
              {item.count} tarjetas
            </p>
            <div
              className="rounded-lg px-3 py-1 text-xs font-semibold w-fit"
              style={{ background: item.tagBg, color: item.tagText }}
            >
              {item.tag}
            </div>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-lg text-xs font-semibold z-[9999]"
          style={{ background: tokens.color.ink }}
        >
          {toast}
        </div>
      )}
      </main>
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
      className="relative bg-white rounded-2xl p-4 cursor-pointer transition-all duration-100 flex flex-col gap-3"
      style={{
        background: isPressed ? "#F0F0F0" : "white",
        borderColor: tokens.color.border,
        transform: isPressed ? "scale(0.98)" : "scale(1)",
        border: `0.5px solid ${tokens.color.border}`,
      }}
    >
      {/* Due Chip - Absolute positioned top-right */}
      <Badge
        className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1"
        variant={dueCount > 0 ? "default" : "success"}
      >
        {dueCount > 0 ? `${dueCount} due` : "Al día ✓"}
      </Badge>

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl"
        style={{ background: PASTEL_COLORS[index % 5] }}
      >
        {["🍜", "🚇", "🏪", "👋"][Math.floor(Math.random() * 4)]}
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold m-0" style={{ color: tokens.color.ink }}>
        {set.title}
      </h3>

      {/* Card Count */}
      <p className="text-xs m-0" style={{ color: tokens.color.muted }}>
        {set.cardCount} tarjetas
      </p>

      {/* Progress Bar */}
      <div className="w-full h-1 rounded-sm overflow-hidden" style={{ background: tokens.color.border }}>
        <div
          className="h-full rounded-sm transition-all duration-200"
          style={{
            width: `${progressPercent}%`,
            background:
              progressPercent > 50
                ? tokens.color.sage
                : progressPercent > 0
                  ? tokens.color.butter
                  : tokens.color.border,
          }}
        />
      </div>

      {/* Menu Button - Bottom Right */}
      <div className="absolute bottom-3 right-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              onClick={(e) => e.stopPropagation()}
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={`Opciones para ${set.title}`}
              title="Más opciones"
            >
              <MoreVertical size={14} style={{ color: tokens.color.muted }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onStudy();
              }}
              aria-label="Estudiar este set"
            >
              Estudiar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
              aria-label="Renombrar este set"
            >
              Renombrar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              aria-label={set.favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              {set.favorite ? "Quitar de favoritos" : "Favorito"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              aria-label="Compartir este set"
            >
              Compartir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onResetProgress();
              }}
              aria-label="Reiniciar progreso de este set"
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
              aria-label="Eliminar este set"
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

