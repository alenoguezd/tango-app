"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Flashcard, type VocabCard } from "@/components/flashcard";
import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase";

interface StudySet {
  id: string;
  title: string;
  cardCount: number;
  progress: number;
  lastStudied: string;
  cards: VocabCard[];
  userId?: string;
}

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

// Migrate cards without IDs
function migrateCards(cards: VocabCard[]): VocabCard[] {
  return cards.map((card, index) => ({
    ...card,
    id: card.id || index.toString(),
  }));
}

export default function EstudiarPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const setId = params.id as string;
  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 1024;

  const [set, setSet] = useState<StudySet | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadSet();
  }, [setId]);

  const checkAuthAndLoadSet = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setCurrentUserId(user.id);
      loadSetData();
    } catch (error) {
      router.push("/");
    }
  };

  const loadSetData = async () => {
    try {
      console.log("[Estudiar] Loading set:", setId);

      // Try to load from Supabase first
      const { data, error } = await supabase
        .from("sets")
        .select("*")
        .eq("id", setId)
        .single();

      if (!error && data) {
        console.log("[Estudiar] Set loaded from Supabase:", data);
        const found: StudySet = {
          id: data.id,
          title: data.title,
          cardCount: data.card_count,
          progress: 0,
          lastStudied: data.updated_at || new Date().toISOString(),
          cards: data.cards || [],
          userId: data.user_id,
        };

        // Migrate cards if needed
        if (found.cards && !found.cards[0]?.id) {
          found.cards = migrateCards(found.cards);
        }

        setSet(found);
      } else {
        // Fallback to localStorage
        console.log("[Estudiar] Supabase load failed, trying localStorage");
        const savedSets = localStorage.getItem("vocab_sets");
        if (savedSets) {
          let sets: StudySet[] = JSON.parse(savedSets);
          let found = sets.find((s) => s.id === setId);

          if (found) {
            console.log("[Estudiar] Set loaded from localStorage:", found);
            // Migrate cards if they don't have IDs
            if (found.cards && !found.cards[0]?.id) {
              found.cards = migrateCards(found.cards);
              sets = sets.map((s) => s.id === setId ? found : s);
              localStorage.setItem("vocab_sets", JSON.stringify(sets));
            }
            setSet(found);
          }
        }
      }
    } catch (error) {
      console.error("[Estudiar] Error loading set:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardSwiped = async (card: VocabCard, direction: "left" | "right") => {
    // Save progress to localStorage using card.id
    const savedSets = localStorage.getItem("vocab_sets");
    if (savedSets && set) {
      try {
        const sets: StudySet[] = JSON.parse(savedSets);
        const setIndex = sets.findIndex((s) => s.id === set.id);
        if (setIndex !== -1) {
          // Initialize progress if not exists
          if (!Array.isArray(sets[setIndex].progress)) {
            sets[setIndex].progress = 0;
          }

          // Update last studied timestamp
          sets[setIndex].lastStudied = new Date().toISOString();

          // Track individual card progress using card.id
          if (direction === "right") {
            // Mark card as known
            const cardIndex = sets[setIndex].cards.findIndex((c) => c.id === card.id);
            if (cardIndex !== -1) {
              sets[setIndex].cards[cardIndex].known = true;
            }
            sets[setIndex].progress = Math.min(100, (sets[setIndex].progress as number) + 5);
          } else if (direction === "left") {
            // Mark card as not known (needs review)
            const cardIndex = sets[setIndex].cards.findIndex((c) => c.id === card.id);
            if (cardIndex !== -1) {
              sets[setIndex].cards[cardIndex].known = false;
            }
          }

          localStorage.setItem("vocab_sets", JSON.stringify(sets));

          // Try to save to Supabase
          try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
              await supabase
                .from("sets")
                .update({
                  cards: sets[setIndex].cards,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", set.id)
                .eq("user_id", user.id);
            }
          } catch (err) {
            console.log("Supabase progress save failed, using localStorage fallback");
          }
        }
      } catch (error) {
        console.error("Error saving progress:", error);
      }
    }
  };

  const handleBack = () => {
    router.push("/inicio");
  };

  const handleSaveSet = async () => {
    if (!set || !currentUserId) return;

    console.log("[Estudiar] Saving set to user account. Set ID:", setId, "Current User:", currentUserId);

    try {
      const newSetId = Date.now().toString();

      // Create a copy of the set with the new user as owner
      const newSet = {
        id: newSetId,
        user_id: currentUserId,
        title: set.title,
        card_count: set.cardCount,
        cards: set.cards,
        is_public: false,
      };

      console.log("[Estudiar] Inserting new set:", newSet);

      // Save to Supabase
      const { error } = await supabase
        .from("sets")
        .insert(newSet);

      if (error) {
        console.error("[Estudiar] Error saving set:", error);
        setSaveMessage("Error al guardar el set");
        setTimeout(() => setSaveMessage(null), 3000);
        return;
      }

      console.log("[Estudiar] Set saved successfully with ID:", newSetId);
      setSaveMessage("¡Set guardado en tu cuenta!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error("[Estudiar] Error saving set:", err);
      setSaveMessage("Error al guardar el set");
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleNavigate = (tab: "inicio" | "crear" | "progreso" | "perfil") => {
    if (tab === "progreso") {
      router.push("/progreso");
    } else if (tab === "crear") {
      router.push("/crear");
    } else if (tab === "perfil") {
      router.push("/perfil");
    } else {
      router.push("/inicio");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100dvh",
          background: "#FFFFFF",
        }}
      >
        <p>Cargando...</p>
      </div>
    );
  }

  if (!set) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100dvh",
          background: "#FFFFFF",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h1>Set no encontrado</h1>
        <button
          onClick={handleBack}
          style={{
            padding: "10px 20px",
            background: "#1A6B8A",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Volver
        </button>
      </div>
    );
  }

  // ===== MOBILE LAYOUT (< 1024px) =====
  if (isMobile) {
    const isSharedSet = set.userId && set.userId !== currentUserId;

    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
        {isSharedSet && (
          <div style={{
            backgroundColor: "#E3F2FD",
            padding: "12px 16px",
            display: "flex",
            gap: "12px",
            alignItems: "center",
            borderBottom: "1px solid #B3E5FC",
          }}>
            <button
              onClick={handleSaveSet}
              style={{
                flex: 1,
                padding: "10px 16px",
                backgroundColor: "#1A6B8A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Guardar en mi cuenta
            </button>
          </div>
        )}
        {saveMessage && (
          <div style={{
            backgroundColor: "#E8F5E9",
            color: "#2E7D32",
            padding: "10px 16px",
            fontFamily: "var(--font-sans)",
            fontSize: "14px",
            textAlign: "center",
          }}>
            {saveMessage}
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Flashcard
            cards={set.cards}
            title={set.title}
            onBack={handleBack}
            onCardSwiped={handleCardSwiped}
          />
        </div>
      </div>
    );
  }

  // ===== DESKTOP LAYOUT (≥ 1024px) =====
  const isSharedSet = set.userId && set.userId !== currentUserId;

  return (
    <div
      style={{
        height: "100dvh",
        background: "#F7F6F3",
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      <AppSidebar activeTab="inicio" onNavigate={handleNavigate} />

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
        {isSharedSet && (
          <div style={{
            backgroundColor: "#E3F2FD",
            padding: "12px 20px",
            display: "flex",
            gap: "12px",
            alignItems: "center",
            borderBottom: "1px solid #B3E5FC",
          }}>
            <button
              onClick={handleSaveSet}
              style={{
                padding: "10px 20px",
                backgroundColor: "#1A6B8A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Guardar en mi cuenta
            </button>
            {saveMessage && (
              <div style={{
                color: "#2E7D32",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
              }}>
                {saveMessage}
              </div>
            )}
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Flashcard
            cards={set.cards}
            title={set.title}
            onBack={handleBack}
            onCardSwiped={handleCardSwiped}
          />
        </div>
      </div>
    </div>
  );
}
