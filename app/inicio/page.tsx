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

    // Reload sets when page becomes visible (user returns from study)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadSets(localStorage.getItem("current_user_id") || "");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const checkAuthAndLoadSets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setIsAuthenticated(true);
      localStorage.setItem('current_user_id', user.id);
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

      if (error) {
        console.error("[Inicio] Supabase select error:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: JSON.stringify(error)
        });
        throw error;
      }

      console.log("[Inicio] Sets loaded from Supabase:", data);

      const supabaseSets = (data || []).map((set: any) => ({
        id: set.id,
        title: set.name,
        cardCount: (set.cards || []).length,
        progress: set.progress || 0,
        lastStudied: set.last_studied || set.created_at || new Date().toISOString(),
        cards: set.cards || [],
        favorite: set.is_favorite || false,
      }));

      console.log("[Inicio] Sets mapped from Supabase:", supabaseSets);
      setSets(supabaseSets);

      // Merge with localStorage to preserve any newly created sets not yet in Supabase
      try {
        const localSets = JSON.parse(localStorage.getItem("vocab_sets") || "[]");

        // Find sets that are in localStorage but not in Supabase (newly created)
        const newLocalSets = localSets.filter((localSet: any) =>
          !supabaseSets.some((remoteSet) => remoteSet.id === localSet.id)
        );

        // Merge: Supabase sets (source of truth) + local-only sets (not yet synced)
        const mergedSets = [...supabaseSets, ...newLocalSets];

        localStorage.setItem("vocab_sets", JSON.stringify(mergedSets));
        console.log("[Inicio] Sets merged with localStorage:", {
          fromSupabase: supabaseSets.length,
          newLocalSets: newLocalSets.length,
          total: mergedSets.length
        });
      } catch (err) {
        console.error("[Inicio] Failed to merge with localStorage:", err);
        // Fallback: just save Supabase sets
        localStorage.setItem("vocab_sets", JSON.stringify(supabaseSets));
      }
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
