"use client";

import { HomeScreen, type DeckSet } from "@/components/home-screen";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSets, storedSetToDeckSet } from "@/lib/storage";

export default function Page() {
  const router = useRouter();
  const [sets, setSets] = useState<DeckSet[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedSets = getSets();
    const deckSets = storedSets.map(storedSetToDeckSet);
    setSets(deckSets);
  }, []);

  if (!mounted) return null;

  const recent = sets.length > 0 ? sets[0] : null;

  return (
    <HomeScreen
      sets={sets}
      recent={recent}
      onContinue={(set: DeckSet) => router.push(`/estudiar/${set.id}`)}
      onStudy={(set: DeckSet) => router.push(`/estudiar/${set.id}`)}
      onGoCrear={() => router.push("/crear")}
      onGoProgreso={() => router.push("/progreso")}
    />
  );
}
