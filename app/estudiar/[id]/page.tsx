"use client";

import { Flashcard, type VocabCard } from "@/components/flashcard";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSet, updateProgress, markStudied } from "@/lib/storage";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [cards, setCards] = useState<VocabCard[]>([]);
  const [title, setTitle] = useState("");
  const [mounted, setMounted] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!id) return;

    const set = getSet(id);
    if (!set) {
      setNotFound(true);
      return;
    }

    setCards(set.cards);
    setTitle(set.name);
  }, [id]);

  const handleSwipeRight = (card: VocabCard) => {
    if (!id) return;
    updateProgress(id, card.kana, true);
    markStudied(id);
  };

  const handleSwipeLeft = (card: VocabCard) => {
    if (!id) return;
    updateProgress(id, card.kana, false);
    markStudied(id);
  };

  if (!mounted) return null;

  if (notFound) {
    return (
      <div style={{
        height: "100dvh",
        width: "100%",
        maxWidth: "375px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        padding: "20px",
        textAlign: "center",
      }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>Set no encontrado</h1>
        <p style={{ color: "#666", margin: 0 }}>El set que buscas no existe o fue eliminado.</p>
        <button
          onClick={() => router.push("/inicio")}
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            background: "#1A6B8A",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <Flashcard
      cards={cards}
      title={title || "単語カード"}
      onBack={() => router.push("/inicio")}
      onSwipeRight={handleSwipeRight}
      onSwipeLeft={handleSwipeLeft}
    />
  );
}
