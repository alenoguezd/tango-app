"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HomeScreen } from "@/components/home-screen";
import { createClient } from "@/lib/supabase";
import type { DeckSet } from "@/components/home-screen";

export default function InicioPage() {
  const router = useRouter();
  const supabase = createClient();
  const [sets, setSets] = useState<DeckSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndLoadSets();
  }, []);

  const checkAuthAndLoadSets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setIsAuthenticated(true);
      loadSets(user.id);
    } catch (error) {
      router.push("/login");
    }
  };

  const loadSets = async (userId: string) => {
    try {
      // Load from Supabase
      const { data, error } = await supabase
        .from("sets")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      const supabaseSets = (data || []).map((set: any) => ({
        id: set.id,
        title: set.title,
        cardCount: set.card_count,
        progress: 0,
        lastStudied: set.updated_at || new Date().toISOString(),
        cards: set.cards || [],
        favorite: set.is_favorite || false,
      }));

      setSets(supabaseSets);
    } catch (error) {
      console.error("Error loading sets:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
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

  return (
    <HomeScreen
      sets={sets}
      recent={null}
      onContinue={() => {}}
      onStudy={handleStudy}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    />
  );
}
