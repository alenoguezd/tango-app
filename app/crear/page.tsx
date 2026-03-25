"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CrearScreen } from "@/components/crear-screen";
import { createClient } from "@/lib/supabase";

export default function CrearPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

      setIsAuthenticated(true);
    } catch (error) {
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (tab: "inicio" | "crear" | "progreso" | "perfil") => {
    if (tab === "progreso") {
      router.push("/progreso");
    } else if (tab === "perfil") {
      router.push("/perfil");
    } else {
      router.push("/inicio");
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

  return <CrearScreen onNavigate={handleNavigate} />;
}
