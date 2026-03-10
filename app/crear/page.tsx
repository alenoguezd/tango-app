"use client";

import { CrearScreen } from "@/components/crear-screen";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <CrearScreen
      onGoHome={() => router.push("/inicio")}
      onGoProgreso={() => router.push("/progreso")}
      onStudyNew={(id: string) => router.push(`/estudiar/${id}`)}
    />
  );
}
