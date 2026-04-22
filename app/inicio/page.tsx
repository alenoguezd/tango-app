"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HomeScreen } from "@/components/home-screen";
import { createClient } from "@/lib/supabase";
import type { DeckSet, PublicSet } from "@/components/home-screen";

export default function InicioPage() {
  const router = useRouter();
  const supabase = createClient();
  const [sets, setSets] = useState<DeckSet[]>([]);
  const [publicSets, setPublicSets] = useState<PublicSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyGoal, setDailyGoal] = useState<{ newPerDay: number; reviewPerDay: number }>({
    newPerDay: 10,
    reviewPerDay: 40,
  });

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
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/");
        return;
      }

      // First-time users: go through onboarding before home
      if (!user.user_metadata?.daily_goal) {
        router.push("/onboarding");
        return;
      }

      // Store the user's goal so the home screen can cap the queue
      const goal = user.user_metadata.daily_goal as { newPerDay: number; reviewPerDay: number };
      setDailyGoal({ newPerDay: goal.newPerDay ?? 10, reviewPerDay: goal.reviewPerDay ?? 40 });

      localStorage.setItem('current_user_id', user.id);
      loadSets(user.id);
      loadPublicSets();
    } catch (error) {
      router.push("/");
    }
  };

  const loadPublicSets = async () => {
    try {
      const { data, error } = await supabase
        .from("sets")
        .select("id, name, cards")
        .eq("is_public", true)
        .is("user_id", null);

      if (!error && data) {
        // Guard: drop rows whose cards column is null/missing
        setPublicSets(
          (data as PublicSet[]).filter((s) => Array.isArray(s.cards))
        );
      }
    } catch {
      // Non-fatal: public sets are decorative; silently skip on network error
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


      const supabaseSets = (data || []).map((set: any) => {
        const rawProgress = set.progress;
        const isArray = Array.isArray(rawProgress);
        console.log(`[DEBUG inicio] Set "${set.name}" from Supabase:`, {
          progressType: typeof rawProgress,
          isArray,
          progressLength: isArray ? rawProgress.length : rawProgress,
          sampleNextReview: isArray && rawProgress.length > 0 ? rawProgress[0]?.nextReview : "N/A",
          updated_at: set.updated_at,
        });
        return {
          id: set.id,
          title: set.name,
          cardCount: (set.cards || []).length,
          // Never default progress to a number — keeps Array.isArray checks reliable
          progress: isArray ? rawProgress : [],
          // updated_at is the column written on every study swipe; last_studied doesn't exist
          lastStudied: set.updated_at || set.created_at || new Date().toISOString(),
          cards: set.cards || [],
          favorite: set.is_favorite || false,
        };
      });


      // Load from localStorage first (it has the latest progress from studying)
      let displaySets = supabaseSets;
      try {
        const localSets = JSON.parse(localStorage.getItem("vocab_sets") || "[]");

        if (localSets.length > 0) {
          // Merge: pick the more recently studied progress source for each set
          const mergedSets = localSets
            .filter((localSet: any) => supabaseSets.some((s) => s.id === localSet.id))
            .map((localSet: any) => {
              const remoteSet = supabaseSets.find((s) => s.id === localSet.id)!;

              // Compare timestamps to decide which progress array wins.
              // Both Supabase (updated_at) and localStorage (lastStudied) store ISO strings.
              const remoteTs = remoteSet.lastStudied || "";
              const localTs  = localSet.lastStudied  || "";
              const useRemoteProgress = remoteTs > localTs;

              return {
                ...remoteSet,                                          // Supabase fields as base
                ...localSet,                                           // localStorage meta overrides
                progress: useRemoteProgress
                  ? (Array.isArray(remoteSet.progress) ? remoteSet.progress : [])
                  : (Array.isArray(localSet.progress)  ? localSet.progress  : []),
                lastStudied: remoteTs > localTs ? remoteTs : localTs, // keep the most recent
              };
            });

          // Also include any sets that were in Supabase but not localStorage
          const supabaseOnlySets = supabaseSets.filter((remoteSet) =>
            !mergedSets.some((s: any) => s.id === remoteSet.id)
          );

          displaySets = [...mergedSets, ...supabaseOnlySets];
          displaySets.forEach((s: any) => {
            console.log(`[DEBUG inicio] Merged set "${s.title}":`, {
              progressLength: Array.isArray(s.progress) ? s.progress.length : s.progress,
              lastStudied: s.lastStudied,
              sampleNextReview: Array.isArray(s.progress) && s.progress.length > 0 ? s.progress[0]?.nextReview : "N/A",
            });
          });
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
      publicSets={publicSets}
      sets={sets}
      dailyGoal={dailyGoal}
      recent={null}
      onContinue={() => {}}
      onStudy={handleStudy}
      onNavigate={handleNavigate}
    />
  );
}
