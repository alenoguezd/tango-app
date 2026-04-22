"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HomeScreen } from "@/components/home-screen";
import { createClient } from "@/lib/supabase";
import { rowToCardProgress } from "@/lib/sm2";
import type { Database } from "@/lib/database.types";
import type { DeckSet, PublicSet } from "@/components/home-screen";

type ProgressRow = Database["public"]["Tables"]["user_progress"]["Row"];

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

    // Reload when user returns from a study session
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const uid = localStorage.getItem("current_user_id");
        if (uid) loadSets(uid);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const checkAuthAndLoadSets = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) { router.push("/"); return; }

      if (!user.user_metadata?.daily_goal) { router.push("/onboarding"); return; }

      const goal = user.user_metadata.daily_goal as { newPerDay: number; reviewPerDay: number };
      setDailyGoal({ newPerDay: goal.newPerDay ?? 10, reviewPerDay: goal.reviewPerDay ?? 40 });

      localStorage.setItem("current_user_id", user.id);
      loadSets(user.id);
      loadPublicSets();
    } catch {
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
        setPublicSets((data as PublicSet[]).filter((s) => Array.isArray(s.cards)));
      }
    } catch {
      // non-fatal
    }
  };

  const loadSets = async (userId: string) => {
    try {
      // Parallel fetch: user-owned sets + all their SM-2 progress rows
      const [setsResult, progressResult] = await Promise.all([
        supabase.from("sets").select("*").eq("user_id", userId),
        supabase.from("user_progress").select("*").eq("user_id", userId),
      ]);

      const setsData = setsResult.data || [];
      const progressRows: ProgressRow[] = (progressResult.data as ProgressRow[] | null) || [];

      // Build a map: set_id → CardProgress[]
      const progressBySet = new Map<string, ReturnType<typeof rowToCardProgress>[]>();
      for (const row of progressRows) {
        if (!progressBySet.has(row.set_id)) progressBySet.set(row.set_id, []);
        progressBySet.get(row.set_id)!.push(rowToCardProgress(row));
      }

      // User-owned sets with their progress
      const ownedSets: DeckSet[] = setsData.map((set: any) => ({
        id: set.id,
        title: set.name,
        cardCount: (set.cards || []).length,
        progress: progressBySet.get(set.id) || [],
        lastStudied: set.last_studied || set.created_at || new Date().toISOString(),
        cards: set.cards || [],
        favorite: set.is_favorite || false,
      }));

      // Public sets the user has studied — identified by progress rows with a
      // set_id that isn't in the user's owned sets
      const studiedPublicSetIds = [
        ...new Set(
          progressRows
            .map((r: any) => r.set_id as string)
            .filter((id) => !ownedSets.some((s) => s.id === id))
        ),
      ];

      let publicStudiedSets: DeckSet[] = [];
      if (studiedPublicSetIds.length > 0) {
        const { data: publicData } = await supabase
          .from("sets")
          .select("*")
          .in("id", studiedPublicSetIds);

        publicStudiedSets = (publicData || []).map((set: any) => ({
          id: set.id,
          title: set.name,
          cardCount: (set.cards || []).length,
          progress: progressBySet.get(set.id) || [],
          lastStudied: new Date().toISOString(),
          cards: set.cards || [],
          favorite: false,
          is_public: true,
        }));
      }

      setSets([...ownedSets, ...publicStudiedSets]);
    } catch {
      // leave sets empty
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (tab: "inicio" | "crear" | "progreso" | "perfil") => {
    if (tab === "progreso") router.push("/progreso");
    else if (tab === "crear") router.push("/crear");
    else if (tab === "perfil") router.push("/perfil");
  };

  const handleStudy = (set: DeckSet) => router.push(`/estudiar/${set.id}`);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100dvh", background: "#FFFFFF" }}>
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
