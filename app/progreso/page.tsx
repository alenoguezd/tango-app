"use client";

import { ProgresoScreen, type SetProgress } from "@/components/progreso-screen";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSets, storedSetToProgress } from "@/lib/storage";

export default function Page() {
  const router = useRouter();
  const [sets, setSets] = useState<SetProgress[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedSets = getSets();
    const progressSets = storedSets.map(storedSetToProgress);
    setSets(progressSets);
  }, []);

  if (!mounted) return null;

  return (
    <ProgresoScreen
      sets={sets}
      onGoHome={() => router.push("/inicio")}
      onGoCrear={() => router.push("/crear")}
    />
  );
}
