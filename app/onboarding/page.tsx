"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { OnboardingScreen, type DailyGoal } from "@/components/onboarding-screen";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
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
  };

  const handleSave = async (goal: DailyGoal) => {
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
