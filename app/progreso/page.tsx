"use client";

import { useRouter } from "next/navigation";
import { ProgresoScreen } from "@/components/progreso-screen";

export default function ProgresoPage() {
  const router = useRouter();

  const handleNavigate = (tab: "inicio" | "crear" | "progreso") => {
    if (tab === "inicio") {
      router.push("/");
    } else if (tab === "crear") {
      router.push("/");
    } else if (tab === "progreso") {
      // Already on progreso page
    }
  };

  return <ProgresoScreen onNavigate={handleNavigate} />;
}
