"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/splash-screen";
import { HomeScreen } from "@/components/home-screen";
import { CrearScreen } from "@/components/crear-screen";
import { createClient } from "@/lib/supabase";
import type { DeckSet } from "@/components/home-screen";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
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

  const handleSplashStart = async () => {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // User is logged in, go to inicio
        localStorage.setItem("hasSeenSplash", "true");
        setShowSplash(false);
      } else {
        // User not logged in, go to login
        router.push("/login");
      }
    } catch (error) {
      // If error checking auth, go to login
      router.push("/login");
    }
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
