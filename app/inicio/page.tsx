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
        router.push("/");
        return;
      }

      setIsAuthenticated(true);
      loadSets(user.id);
    } catch (error) {
      router.push("/");
    }
  };

  const loadSets = async (userId: string) => {
    try {
      console.log("[Inicio] Loading sets for user:", userId);
      // Load from Supabase
      const { data, error } = await supabase
        .from("sets")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      console.log("[Inicio] Sets loaded from Supabase:", data);

      const supabaseSets = (data || []).map((set: any) => ({
        id: set.id,
        title: set.title,
        cardCount: set.card_count,
        progress: 0,
        lastStudied: set.updated_at || new Date().toISOString(),
        cards: set.cards || [],
        favorite: set.is_favorite || false,
      }));

      console.log("[Inicio] Sets mapped to state:", supabaseSets);
      setSets(supabaseSets);

      // Save to localStorage so they're available offline and in other tabs
      localStorage.setItem("vocab_sets", JSON.stringify(supabaseSets));
      console.log("[Inicio] Sets saved to localStorage for offline access");
    } catch (error) {
      console.error("[Inicio] Error loading sets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (tab: "inicio" | "crear" | "progreso" | "perfil") => {
    if (tab === "progreso") {
      router.push("/progreso");
    } else if (tab === "crear") {
      router.push("/crear");
    } else if (tab === "perfil") {
      router.push("/perfil");
    }
  };

  const handleStudy = (set: DeckSet) => {
    router.push(`/estudiar/${set.id}`);
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
    />
  );
}
