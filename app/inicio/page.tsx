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
      // Load from Supabase
      const { data, error } = await supabase
        .from("sets")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        throw error;
      }


      const supabaseSets = (data || []).map((set: any) => ({
        id: set.id,
        title: set.name,
        cardCount: (set.cards || []).length,
        progress: set.progress || 0,
        lastStudied: set.last_studied || set.created_at || new Date().toISOString(),
        cards: set.cards || [],
        favorite: set.is_favorite || false,
      }));


      // Load from localStorage first (it has the latest progress from studying)
      let displaySets = supabaseSets;
      try {
        const localSets = JSON.parse(localStorage.getItem("vocab_sets") || "[]");

        if (localSets.length > 0) {
          // Merge: Use localStorage as the source for display (has latest progress)
          // but sync back to Supabase data structure
          const mergedSets = localSets.map((localSet: any) => {
            // Find matching Supabase set to get any remote-only fields
            const remoteSet = supabaseSets.find((s) => s.id === localSet.id);
            return {
              ...remoteSet, // Supabase fields as base
              ...localSet,  // localStorage fields override (has latest progress)
            };
          });

          // Also include any sets that were in Supabase but not localStorage
          const supabaseOnlySets = supabaseSets.filter((remoteSet) =>
            !mergedSets.some((s) => s.id === remoteSet.id)
          );

          displaySets = [...mergedSets, ...supabaseOnlySets];
          localStorage.setItem("vocab_sets", JSON.stringify(displaySets));
        }
      } catch (err) {
      }

      // Set display state with merged sets (localStorage takes priority for progress)
      setSets(displaySets);
    } catch (error) {
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
