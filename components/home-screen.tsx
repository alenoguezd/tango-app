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
  is_public?: boolean;
}

export interface PublicSet {
  id: string;
  name: string;
  cards: Array<Record<string, unknown>>;
}

type BadgeLabel = "Básico" | "Viaje" | "Cotidiano" | "Esencial";

interface HomeScreenProps {
  publicSets?: PublicSet[];
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

// ── Public set metadata: name → display category + badge ─────────────────────
// The DB doesn't store category/badge_label so we derive them here from set name.
const SET_META: Record<string, { displayCategory: string; badge: BadgeLabel; emoji: string }> = {
  "Saludos":                  { displayCategory: "Primer viaje a Japón",  badge: "Básico",    emoji: "👋" },
  "En el restaurante":        { displayCategory: "Primer viaje a Japón",  badge: "Viaje",     emoji: "🍱" },
  "Familia":                  { displayCategory: "Conversación básica",   badge: "Básico",    emoji: "👪" },
  "Clima":                    { displayCategory: "Conversación básica",   badge: "Cotidiano", emoji: "🌤️" },
  "Números y tiempo":         { displayCategory: "Esencial",              badge: "Esencial",  emoji: "🔢" },
  "Emergencias y salud":      { displayCategory: "Esencial",              badge: "Esencial",  emoji: "🏥" },
  "Transporte y direcciones": { displayCategory: "Viaje",                 badge: "Viaje",     emoji: "🚇" },
  "Hotel y alojamiento":      { displayCategory: "Viaje",                 badge: "Viaje",     emoji: "🏨" },
  "Ir de compras":            { displayCategory: "Cotidiano",             badge: "Cotidiano", emoji: "🛒" },
  "Comida y bebida":          { displayCategory: "Cotidiano",             badge: "Cotidiano", emoji: "🍜" },
};

const CATEGORY_ORDER = [
  "Primer viaje a Japón",
  "Conversación básica",
  "Esencial",
  "Viaje",
  "Cotidiano",
];

function getSetMeta(name: string) {
  return SET_META[name] ?? { displayCategory: "Otros", badge: "Básico" as BadgeLabel, emoji: "📖" };
}

function groupPublicSetsByCategory(sets: PublicSet[]): [string, PublicSet[]][] {
  const map = new Map<string, PublicSet[]>();
  sets.forEach((s) => {
    const cat = getSetMeta(s.name).displayCategory;
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(s);
  });
  // Return in canonical order, then any unknown categories
  const ordered: [string, PublicSet[]][] = [];
  CATEGORY_ORDER.forEach((cat) => {
    if (map.has(cat)) ordered.push([cat, map.get(cat)!]);
  });
  map.forEach((sets, cat) => {
    if (!CATEGORY_ORDER.includes(cat)) ordered.push([cat, sets]);
  });
  return ordered;
}

function badgeVariant(label: BadgeLabel): "default" | "secondary" | "destructive" | "warning" | "success" {
  switch (label) {
    case "Viaje":     return "destructive";
    case "Cotidiano": return "default";
    case "Esencial":  return "warning";
    default:          return "secondary"; // Básico
  }
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

  return mounted ? windowWidth : 1024;
}

// ── HomeScreen ────────────────────────────────────────────────────────────────────
export function HomeScreen({ publicSets = [], sets: propSets, recent, onContinue, onStudy, onNavigate, onLogout }: HomeScreenProps) {
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
      <div className="h-screen max-w-[390px] mx-auto flex flex-col bg-bg-page">
        {/* Top Safe Area */}
        <div aria-hidden className="flex-shrink-0 h-[max(16px,env(safe-area-inset-top,0px))]" />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch] pb-[100px]">
          {/* Greeting */}
          <div className="px-4 py-4 flex justify-between items-center">
            <h1 className="text-3xl font-bold leading-tight text-text-primary">
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
          <div className="px-4 pb-3 flex items-center gap-2 text-sm font-normal leading-normal text-text-secondary">
            <Flame size={16} className="text-orange" />
            <span>Racha de 7 días</span>
          </div>

          {/* Today Card (Dark Banner) */}
          <div className="mx-4 mb-6 rounded-lg p-5 bg-text-primary text-white relative">
            <div className="mb-4">
              <p className="text-xs font-bold text-text-secondary">
                Today
              </p>
              <p className="text-2xl font-bold leading-none mt-1">
                {totalDueCards}
              </p>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-butter transition-normal"
                style={{
                  width: `${totalCards > 0 ? (totalDueCards / totalCards) * 100 : 0}%`,
                }}
              />
            </div>
            {/* Estudiar Button */}
            {firstDueSet && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onStudy(firstDueSet);
                }}
                className="absolute top-3 right-3 bg-butter text-text-primary px-3 py-1 text-xs font-bold hover:opacity-90 rounded-sm"
              >
                Estudiar
              </Button>
            )}
          </div>

          {/* Public sets grouped by category */}
          {groupPublicSetsByCategory(publicSets).map(([category, sets]) => (
            <div key={category} className="mb-6">
              <h2 className="px-4 text-lg font-bold leading-tight text-text-primary mb-3">
                {category}
              </h2>
              <div className="flex gap-3 overflow-x-auto [-webkit-overflow-scrolling:touch] pb-2 px-4">
                {sets.map((set) => {
                  const meta = getSetMeta(set.name);
                  return (
                    <button
                      key={set.id}
                      onClick={() => onStudy({ id: set.id, title: set.name, cardCount: set.cards.length, progress: [], lastStudied: "", cards: set.cards as VocabCard[] })}
                      className="min-w-[140px] bg-surface border border-border-default rounded-lg p-3 flex flex-col gap-2 text-left cursor-pointer hover:bg-bg-subtle transition-colors"
                    >
                      <p className="text-2xl m-0">{meta.emoji}</p>
                      <p className="text-xs font-bold m-0 text-text-primary">
                        {set.name}
                      </p>
                      <p className="text-xs m-0 text-text-secondary">
                        {set.cards.length} tarjetas
                      </p>
                      <Badge className="text-xs w-fit" variant={badgeVariant(meta.badge)}>
                        {meta.badge}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* User sets ("Creados por mi") */}
          {localSets.length > 0 && (
            <div className="px-4 mb-6">
              <h2 className="text-lg font-bold leading-tight text-text-primary mb-3">
                Creados por mi
              </h2>
              <div className="grid grid-cols-2 gap-2">
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
            </div>
          )}
        </div>

        {/* Create Set Button */}
        <div className="px-4 pb-3">
          <Button
            onClick={() => onNavigate("crear")}
            className="w-full bg-text-primary text-white font-bold py-3 px-4 rounded-sm hover:opacity-90"
          >
            Create set
          </Button>
        </div>

        {/* Navigation */}
        <AppNav active="inicio" onNavigate={onNavigate} />

        {/* Bottom Safe Area */}
        <div aria-hidden className="flex-shrink-0 bg-surface flex justify-center pt-1" style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom, 6px))" }}>
          <div className="w-[134px] h-1 rounded-full bg-text-primary" />
        </div>

        {/* Toast */}
        {toast && (
          <div
            className="fixed bottom-[80px] left-1/2 -translate-x-1/2 text-white px-5 py-3 rounded-lg text-xs font-semibold z-[9999] bg-text-primary"
          >
            {toast}
          </div>
        )}
      </div>
    );
  }

  // ===== DESKTOP LAYOUT =====
  return (
    <div className="flex min-h-screen bg-bg-page">
      {/* Sidebar Navigation */}
      <AppNav active="inicio" onNavigate={onNavigate} />

      {/* Main Content */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0" />
      <main className="flex-1 lg:pt-8 lg:pb-6 lg:px-10 p-10 max-w-5xl">

      {/* Greeting */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 m-0 text-text-primary">
          Hi,
          <span className="text-sage">
            {userFirstName}
          </span>
        </h1>
        <Button variant="outline" size="icon" className="rounded-full">
          <Settings size={20} />
        </Button>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-2 mb-8 text-sm text-text-secondary">
        <Flame size={16} className="text-orange" />
        <span>Racha de 7 días</span>
      </div>

      {/* Today Card */}
      <div className="rounded-lg p-8 mb-8 text-white bg-text-primary relative">
        <div className="mb-6">
          <p className="text-xs font-bold text-text-secondary">
            Today
          </p>
          <p className="text-4xl font-bold leading-none mt-2">
            {totalDueCards}
          </p>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-butter transition-normal"
            style={{
              width: `${totalCards > 0 ? (totalDueCards / totalCards) * 100 : 0}%`,
            }}
          />
        </div>
        {/* Estudiar Button */}
        {firstDueSet && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onStudy(firstDueSet);
            }}
            className="absolute top-8 right-8 bg-butter text-text-primary px-4 py-2 text-sm font-bold hover:opacity-90 rounded-sm"
          >
            Estudiar
          </Button>
        )}
      </div>

      {/* Public sets grouped by category */}
      {groupPublicSetsByCategory(publicSets).map(([category, sets]) => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-text-primary">
            {category}
          </h2>
          <div className="grid grid-cols-3 gap-6">
            {sets.map((set) => {
              const meta = getSetMeta(set.name);
              return (
                <button
                  key={set.id}
                  onClick={() => onStudy({ id: set.id, title: set.name, cardCount: set.cards.length, progress: [], lastStudied: "", cards: set.cards as VocabCard[] })}
                  className="bg-surface rounded-lg p-5 flex flex-col gap-3 border border-border-default text-left cursor-pointer hover:bg-bg-subtle transition-colors"
                >
                  <p className="text-4xl m-0">{meta.emoji}</p>
                  <p className="text-base font-bold m-0 text-text-primary">
                    {set.name}
                  </p>
                  <p className="text-xs m-0 text-text-secondary">
                    {set.cards.length} tarjetas
                  </p>
                  <Badge className="text-xs w-fit" variant={badgeVariant(meta.badge)}>
                    {meta.badge}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* User sets ("Creados por mi") */}
      {localSets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-text-primary">
            Creados por mi
          </h2>
          <div className="grid grid-cols-2 gap-6">
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
        </div>
      )}

      {/* Create Set Button */}
      <Button
        onClick={() => onNavigate("crear")}
        className="w-full bg-text-primary text-white font-bold py-3 px-4 rounded-sm hover:opacity-90"
      >
        Create set
      </Button>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-lg text-xs font-semibold z-[9999] bg-text-primary"
        >
          {toast}
        </div>
      )}
      </main>
    </div>
  );
}

// ── Set Grid Card Component (user-created sets only) ─────────────────────────
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
  const progress = (set.progress || []) as CardProgress[];
  const knownCount = Array.isArray(progress) ? progress.filter((c) => c.known === true).length : 0;
  const progressPercent = set.cardCount > 0 ? Math.round((knownCount / set.cardCount) * 100) : 0;

  return (
    <div
      className="relative bg-surface rounded-lg p-4 cursor-pointer flex flex-col gap-3 border border-border-default hover:bg-bg-subtle transition-colors"
      onClick={() => onStudy()}
    >
      {/* Header: Icon + options menu */}
      <div className="flex justify-between items-start gap-2">
        <div
          className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 text-xl"
          style={{ background: PASTEL_COLORS[index % 5] }}
        >
          📖
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                aria-label={`Opciones para ${set.title}`}
              >
                <MoreVertical size={16} className="text-text-secondary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
                Renombrar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }}>
                Compartir
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-rose"
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold m-0 text-text-primary">
        {set.title}
      </h3>

      {/* Card Count */}
      <p className="text-xs m-0 text-text-secondary">
        {set.cardCount} tarjetas
      </p>

      {/* Progress Bar */}
      <div className="w-full h-1 rounded-sm overflow-hidden bg-border-default">
        <div
          className="h-full rounded-sm transition-colors"
          style={{
            width: `${progressPercent}%`,
            background:
              progressPercent > 50
                ? "var(--color-sage)"
                : progressPercent > 0
                  ? "var(--color-butter)"
                  : "var(--color-border)",
          }}
        />
      </div>

      {/* Editar link */}
      <div className="pt-1">
        <button
          onClick={(e) => { e.stopPropagation(); onRename(); }}
          className="text-xs font-bold text-sky hover:opacity-75 transition-colors"
        >
          Editar
        </button>
      </div>
    </div>
  );
}

