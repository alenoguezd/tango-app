"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/splash-screen";
import { HomeScreen } from "@/components/home-screen";
import { CrearScreen } from "@/components/crear-screen";
import type { DeckSet } from "@/components/home-screen";

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<"inicio" | "crear" | "progreso">("inicio");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check if user has already seen the splash screen
    const hasSeenSplash = localStorage.getItem("hasSeenSplash");
    if (hasSeenSplash === "true") {
      setShowSplash(false);
    }
    setMounted(true);
  }, []);

  const handleSplashStart = () => {
    localStorage.setItem("hasSeenSplash", "true");
    setShowSplash(false);
  };

  const handleNavigate = (tab: "inicio" | "crear" | "progreso") => {
    if (tab === "progreso") {
      router.push("/progreso");
    } else {
      setCurrentScreen(tab);
    }
  };

  const handleStudy = (set: DeckSet) => {
    router.push(`/estudiar/${set.id}`);
  };

  if (showSplash) {
    return <SplashScreen onStart={handleSplashStart} />;
  }

  return (
    <>
      {currentScreen === "inicio" && (
        <HomeScreen
          sets={[]}
          recent={null}
          onContinue={() => {}}
          onStudy={handleStudy}
          onNavigate={handleNavigate}
        />
      )}
      {currentScreen === "crear" && (
        <CrearScreen onNavigate={handleNavigate} />
      )}
    </>
  );
}
