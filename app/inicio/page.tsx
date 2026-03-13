"use client";

import { useRouter } from "next/navigation";
import { HomeScreen } from "@/components/home-screen";
import type { DeckSet } from "@/components/home-screen";

export default function InicioPage() {
  const router = useRouter();

  const handleNavigate = (tab: "inicio" | "crear" | "progreso") => {
    if (tab === "progreso") {
      router.push("/progreso");
    } else {
      router.push("/");
    }
  };

  const handleStudy = (set: DeckSet) => {
    router.push(`/estudiar/${set.id}`);
  };

  return (
    <HomeScreen
      sets={[]}
      recent={null}
      onContinue={() => {}}
      onStudy={handleStudy}
      onNavigate={handleNavigate}
    />
  );
}
