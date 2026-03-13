"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Flashcard, type VocabCard } from "@/components/flashcard";
import { AppSidebar } from "@/components/app-sidebar";

interface StudySet {
  id: string;
  title: string;
  cardCount: number;
  progress: number;
  lastStudied: string;
  cards: VocabCard[];
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
  const setId = params.id as string;
  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 1024;

  const [set, setSet] = useState<StudySet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load set from localStorage and migrate if needed
    const savedSets = localStorage.getItem("vocab_sets");
    if (savedSets) {
      try {
        let sets: StudySet[] = JSON.parse(savedSets);
        let found = sets.find((s) => s.id === setId);

        if (found) {
          // Migrate cards if they don't have IDs
          if (found.cards && !found.cards[0]?.id) {
            found.cards = migrateCards(found.cards);
            // Save migrated sets back to localStorage
            sets = sets.map((s) => s.id === setId ? found : s);
            localStorage.setItem("vocab_sets", JSON.stringify(sets));
          }
          setSet(found);
        }
      } catch (error) {
        console.error("Error loading set:", error);
      }
    }
    setLoading(false);
  }, [setId]);

  const handleCardSwiped = (card: VocabCard, direction: "left" | "right") => {
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
        }
      } catch (error) {
        console.error("Error saving progress:", error);
      }
    }
  };

  const handleBack = () => {
    router.push("/inicio");
  };

  const handleNavigate = (tab: "inicio" | "crear" | "progreso") => {
    if (tab === "progreso") {
      router.push("/progreso");
    } else {
      router.push("/");
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
    return (
      <Flashcard
        cards={set.cards}
        title={set.title}
        onBack={handleBack}
        onCardSwiped={handleCardSwiped}
      />
    );
  }

  // ===== DESKTOP LAYOUT (≥ 1024px) =====
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
