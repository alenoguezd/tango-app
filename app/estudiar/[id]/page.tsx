"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Flashcard, type VocabCard } from "@/components/flashcard";
import { SessionComplete } from "@/components/session-complete";
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
  const [previousMastery, setPreviousMastery] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [originalSetName, setOriginalSetName] = useState<string>("");

  useEffect(() => {
    checkAuthAndLoadSet();
  }, [setId]);

  const checkAuthAndLoadSet = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
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

      // Try to load from Supabase first
      const { data, error } = await supabase
        .from("sets")
        .select("*")
        .eq("id", setId)
        .single();

      if (!error && data) {
        const found: StudySet = {
          id: data.id,
          title: data.name,
          cardCount: (data.cards || []).length,
          progress: data.progress || 0,
          lastStudied: data.updated_at || data.created_at || new Date().toISOString(),
          cards: data.cards || [],
          userId: data.user_id,
        };

        // Migrate cards if needed
        if (found.cards && !found.cards[0]?.id) {
          found.cards = migrateCards(found.cards);
        }

        // Calculate previous mastery
        const prev = found.cards ? Math.round(
          (found.cards.filter((c) => c.known === true).length / found.cards.length) * 100
        ) : 0;
        setPreviousMastery(prev);
        setOriginalSetName(found.title);
        setSet(found);
      } else {
        // Fallback to localStorage
        const savedSets = localStorage.getItem("vocab_sets");
        if (savedSets) {
          let sets: StudySet[] = JSON.parse(savedSets);
          let found = sets.find((s) => s.id === setId);

          if (found) {
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
    } finally {
      setLoading(false);
    }
  };

  const handleCardSwiped = async (card: VocabCard, direction: "left" | "right", cardIndex: number) => {
    // Save progress to localStorage using card index from Flashcard
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

          // Update card at the current index (from Flashcard component)
          // This is more reliable than trying to match by ID
          if (cardIndex >= 0 && cardIndex < sets[setIndex].cards.length) {
            if (direction === "right") {
              sets[setIndex].cards[cardIndex].known = true;
            } else {
              sets[setIndex].cards[cardIndex].known = false;
            }
          }

          // Calculate progress based on actual card states (after all updates)
          const knownCount = sets[setIndex].cards.filter((c) => c.known === true).length;
          sets[setIndex].progress = sets[setIndex].cards.length > 0
            ? Math.round((knownCount / sets[setIndex].cards.length) * 100)
            : 0;

          localStorage.setItem("vocab_sets", JSON.stringify(sets));

          // Update component state with the latest card data
          setSet({
            ...set,
            cards: sets[setIndex].cards,
            progress: sets[setIndex].progress,
          });

          // Try to save to Supabase
          try {
            const supabase = createClient();
            const { data: { user }, error } = await supabase.auth.getUser();

            if (user) {
              await supabase
                .from("sets")
                .update({
                  cards: sets[setIndex].cards,
                  progress: sets[setIndex].progress,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", set.id)
                .eq("user_id", user.id);
            }
          } catch (err) {
          }
        }
      } catch (error) {
      }
    }
  };

  const handleBack = () => {
    router.push("/inicio");
  };

  const handleSaveSet = async () => {
    if (!set || !currentUserId) return;


    try {
      const newSetId = crypto.randomUUID();

      // Create a copy of the set with the new user as owner
      const newSet = {
        id: newSetId,
        user_id: currentUserId,
        name: set.title,
        cards: set.cards,
        is_favorite: false,
        is_public: false,
        progress: 0,
      };


      // Save to Supabase
      const { error } = await supabase
        .from("sets")
        .insert(newSet);

      if (error) {
        setSaveMessage("Error al guardar el set");
        setTimeout(() => setSaveMessage(null), 3000);
        return;
      }

      setSaveMessage("¡Set guardado en tu cuenta!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
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

  const handleReviewDifficult = () => {
    if (set) {
      // Filter cards that are marked as difficult or not known
      const difficultCards = set.cards.filter((c) => c.difficulty === "difícil" || c.known === false);
      if (difficultCards.length > 0) {
        // Create temporary filtered set for review (preserve original title)
        const reviewSet = { ...set, cards: difficultCards, title: originalSetName };
        setSet(reviewSet);
        setSessionComplete(false);
      }
    }
  };

  const handleGoHome = () => {
    router.push("/inicio");
  };

  const handleStudyAnother = () => {
    router.push("/inicio");
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

  // Check if session is complete (all cards have been swiped)
  if (sessionComplete && set) {
    const noSe = set.cards.filter((c) => c.known === false && c.difficulty !== "difícil").length;
    const dificil = set.cards.filter((c) => c.difficulty === "difícil").length;
    const conocidas = set.cards.filter((c) => c.known === true).length;

    return (
      <SessionComplete
        setName={set.title}
        total={set.cards.length}
        noSe={noSe}
        dificil={dificil}
        conocidas={conocidas}
        previousMastery={previousMastery}
        streakDays={0}
        onReviewDifficult={handleReviewDifficult}
        onGoHome={handleGoHome}
        onStudyAnother={handleStudyAnother}
      />
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
            onSessionComplete={() => setSessionComplete(true)}
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
            onSessionComplete={() => setSessionComplete(true)}
          />
        </div>
      </div>
    </div>
  );
}
