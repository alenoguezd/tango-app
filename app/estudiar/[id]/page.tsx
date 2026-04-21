"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Flashcard, type VocabCard } from "@/components/flashcard";
import { SessionComplete } from "@/components/session-complete";
import { AppNav } from "@/components/app-nav";
import { createClient } from "@/lib/supabase";
import {
  type CardProgress,
  buildDailyQueue,
  calculateSM2,
  getDueCards,
  migrateProgress,
  getTodayString,
} from "@/lib/sm2";

interface StudySet {
  id: string;
  title: string;
  cardCount: number;
  progress: CardProgress[];
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
  const [dueCardIds, setDueCardIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dailyGoal, setDailyGoal] = useState<{ newPerDay: number; reviewPerDay: number }>({
    newPerDay: 10,
    reviewPerDay: 40,
  });
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

      // Read user's daily goal; fall back to defaults if not set
      const goal = user.user_metadata?.daily_goal as
        | { newPerDay: number; reviewPerDay: number }
        | undefined;
      const resolvedGoal = {
        newPerDay: goal?.newPerDay ?? 10,
        reviewPerDay: goal?.reviewPerDay ?? 40,
      };
      setDailyGoal(resolvedGoal);
      loadSetData(resolvedGoal);
    } catch (error) {
      router.push("/");
    }
  };

  const loadSetData = async (goal: { newPerDay: number; reviewPerDay: number }) => {
    try {
      // 1. Try loading by set ID (owned sets)
      const { data, error } = await supabase
        .from("sets")
        .select("*")
        .eq("id", setId)
        .single();

      if (!error && data) {
        const found = processSetData(data);
        setSet(found);
        calculateAndSetDueCards(found, goal);
      } else {
        // 2. Try loading by share_token (shared links)
        const { data: sharedData, error: sharedError } = await supabase
          .from("sets")
          .select("*")
          .eq("share_token", setId)
          .eq("is_public", true)
          .single();

        if (!sharedError && sharedData) {
          const found = processSetData(sharedData);
          setSet(found);
          calculateAndSetDueCards(found, goal);
        } else {
          // 3. Fallback to localStorage
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
              calculateAndSetDueCards(found, goal);
            }
          }
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Helper: Process set data from Supabase and run SM-2 migration
  const processSetData = (data: Record<string, unknown>): StudySet => {
    // Migrate cards if needed
    let cards = (data.cards || []) as VocabCard[];
    if (cards && !cards[0]?.id) {
      cards = migrateCards(cards);
    }

    // Ensure progress is an array of CardProgress
    let progress = (data.progress || []) as CardProgress[];
    if (!Array.isArray(progress)) {
      // Old format: progress was a number, reconstruct from card.known
      progress = cards.map((card) => ({
        cardId: card.id || "",
        known: card.known || false,
        interval: 1,
        easeFactor: 2.5,
        nextReview: getTodayString(),
        repetitions: 0,
      }));
    } else {
      // Run migration to ensure all cards have SM-2 fields
      progress = migrateProgress(progress as (CardProgress | Record<string, unknown>)[]);
    }

    // Calculate previous mastery
    const prev = cards ? Math.round(
      (cards.filter((c) => c.known === true).length / cards.length) * 100
    ) : 0;
    setPreviousMastery(prev);
    setOriginalSetName(data.name as string || "");

    return {
      id: data.id as string,
      title: data.name as string,
      cardCount: cards.length,
      progress,
      lastStudied: (data.updated_at || data.created_at || new Date().toISOString()) as string,
      cards,
      userId: data.user_id as string | undefined,
    };
  };

  // Helper: Build today's capped queue using the user's daily goal
  const calculateAndSetDueCards = (
    studySet: StudySet,
    goal: { newPerDay: number; reviewPerDay: number } = dailyGoal
  ) => {
    const allCardIds = studySet.cards.map((card, index) => card.id || index.toString());
    const progress = Array.isArray(studySet.progress) ? studySet.progress : [];
    const cappedIds = buildDailyQueue(allCardIds, progress, goal.newPerDay, goal.reviewPerDay);
    setDueCardIds(cappedIds);
  };

  const handleCardSwiped = async (card: VocabCard, direction: "left" | "right", cardIndex: number) => {
    if (!set) return;

    try {
      // Determine quality: right (swipe) = known (1), left = repasar (0)
      const quality = direction === "right" ? 1 : 0;

      // Ensure progress is an array (defensive guard for old format)
      let progressArray = Array.isArray(set.progress) ? set.progress : [];

      // If progress is empty, initialize it with all cards
      if (progressArray.length === 0 && set.cards.length > 0) {
        progressArray = set.cards.map((c, idx) => ({
          cardId: c.id || idx.toString(),
          known: false,
          interval: 1,
          easeFactor: 2.5,
          nextReview: getTodayString(),
          repetitions: 0,
        }));
      }

      // Find the card in progress array
      const cardId = card.id || cardIndex.toString();
      const progressIndex = progressArray.findIndex((p) => p.cardId === cardId);

      if (progressIndex === -1) {
        console.warn(`Card ${cardId} not found in progress array`);
        return;
      }

      // Calculate new SM-2 metrics
      const newCardProgress = calculateSM2(progressArray[progressIndex], quality);

      // Update progress array
      const updatedProgress = [...progressArray];
      updatedProgress[progressIndex] = newCardProgress;

      // Also update card.known for consistency
      const updatedCards = [...set.cards];
      updatedCards[cardIndex].known = quality === 1;

      // Update local state
      const updatedSet: StudySet = {
        ...set,
        progress: updatedProgress,
        cards: updatedCards,
        lastStudied: new Date().toISOString(),
      };

      setSet(updatedSet);
      calculateAndSetDueCards(updatedSet);

      // Save to localStorage
      const savedSets = localStorage.getItem("vocab_sets");
      if (savedSets) {
        try {
          const sets: StudySet[] = JSON.parse(savedSets);
          const setIndex = sets.findIndex((s) => s.id === set.id);
          if (setIndex !== -1) {
            sets[setIndex] = updatedSet;
            localStorage.setItem("vocab_sets", JSON.stringify(sets));
          }
        } catch (err) {
          console.error("Failed to save to localStorage:", err);
        }
      }

      // Save to Supabase in background
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (user) {
          await supabase
            .from("sets")
            .update({
              cards: updatedCards,
              progress: updatedProgress,
              updated_at: new Date().toISOString(),
            })
            .eq("id", set.id)
            .eq("user_id", user.id);
        }
      } catch (err) {
        console.error("Failed to save to Supabase:", err);
      }
    } catch (error) {
      console.error("Error in handleCardSwiped:", error);
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
    const dueCards = set.cards.filter((card) => dueCardIds.has(card.id || ""));

    // Show "all caught up" state when no cards are due
    if (dueCards.length === 0) {
      return (
        <div style={{ height: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", padding: "20px" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "48px", margin: "0 0 12px 0" }}>🎉</p>
            <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0" }}>¡Al día!</h2>
            <p style={{ fontSize: "14px", color: "#8A7F74", margin: 0 }}>Vuelve mañana para más tarjetas</p>
          </div>
          <button
            onClick={handleBack}
            style={{
              padding: "12px 24px",
              backgroundColor: "#1A1A1A",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Volver a inicio
          </button>
        </div>
      );
    }

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
            cards={dueCards}
            title={set.title}
            setId={set.id}
            userId={currentUserId ?? ""}
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
  const dueCards = set.cards.filter((card) => dueCardIds.has(card.id || ""));

  // Show "all caught up" state when no cards are due
  if (dueCards.length === 0) {
    return (
      <div style={{
        height: "100dvh",
        background: "#F7F6F3",
        display: "flex",
        flexDirection: "row",
      }}>
        {/* Navigation */}
        <AppNav active="inicio" onNavigate={handleNavigate} />

        {/* Sidebar spacer for desktop layout */}
        <div style={{ display: "none" }} className="hidden lg:block lg:w-64 flex-shrink-0" />

        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "24px",
        }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "64px", margin: "0 0 16px 0" }}>🎉</p>
            <h2 style={{ fontSize: "32px", fontWeight: 700, margin: "0 0 12px 0" }}>¡Al día!</h2>
            <p style={{ fontSize: "16px", color: "#8A7F74", margin: 0 }}>Vuelve mañana para más tarjetas</p>
          </div>
          <button
            onClick={handleBack}
            style={{
              padding: "12px 32px",
              backgroundColor: "#1A1A1A",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Volver a inicio
          </button>
        </div>
      </div>
    );
  }

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
      {/* Navigation */}
      <AppNav active="inicio" onNavigate={handleNavigate} />

      {/* Sidebar spacer for desktop layout */}
      <div style={{ display: "none" }} className="hidden lg:block lg:w-64 flex-shrink-0" />

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
            cards={dueCards}
            title={set.title}
            setId={set.id}
            userId={currentUserId ?? ""}
            onBack={handleBack}
            onCardSwiped={handleCardSwiped}
            onSessionComplete={() => setSessionComplete(true)}
          />
        </div>
      </div>
    </div>
  );
}
