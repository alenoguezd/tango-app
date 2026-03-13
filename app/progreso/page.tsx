"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProgresoScreen } from "@/components/progreso-screen";
import { createClient } from "@/lib/supabase";

export default function ProgresoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (tab: "inicio" | "crear" | "progreso") => {
    if (tab === "inicio") {
      router.push("/");
    } else if (tab === "crear") {
      router.push("/");
    } else if (tab === "progreso") {
      // Already on progreso page
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

  if (!isAuthenticated) {
    return null;
  }

  return <ProgresoScreen onNavigate={handleNavigate} />;
}
