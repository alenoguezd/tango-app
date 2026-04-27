"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import { OnboardingScreen, type DailyGoal } from "@/components/onboarding-screen";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      if (!hasSupabaseConfig()) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/");
        return;
      }

      // Already completed onboarding — skip to home
      if (user.user_metadata?.daily_goal) {
        router.push("/inicio");
        return;
      }
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleSave = async (goal: DailyGoal) => {
    if (!hasSupabaseConfig()) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { daily_goal: goal },
    });
    if (!error) {
      router.push("/inicio");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-bg-page">
        <p className="text-base text-text-secondary">Cargando...</p>
      </div>
    );
  }

  return <OnboardingScreen onSave={handleSave} />;
}
