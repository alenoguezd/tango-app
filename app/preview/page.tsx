"use client";

import { useRouter } from "next/navigation";
import { Flashcard, type VocabCard } from "@/components/flashcard";

const previewCards: VocabCard[] = [
  {
    id: "preview-1",
    kanji: "朝",
    kana: "あさ",
    spanish: "mañana",
    example_usage: "朝にコーヒーを飲みます。\nTomo café por la mañana.",
    known: false,
    difficulty: null,
  },
  {
    id: "preview-2",
    kanji: "水",
    kana: "みず",
    spanish: "agua",
    example_usage: "水をください。\nAgua, por favor.",
    known: false,
    difficulty: null,
  },
  {
    id: "preview-3",
    kanji: "本",
    kana: "ほん",
    spanish: "libro",
    example_usage: "本を読みます。\nLeo un libro.",
    known: false,
    difficulty: null,
  },
];

export default function PreviewPage() {
  const router = useRouter();

  return (
    <Flashcard
      cards={previewCards}
      title="Vista previa"
      setId="preview"
      userId="preview"
      showRomaji
      onBack={() => router.push("/")}
    />
  );
}
