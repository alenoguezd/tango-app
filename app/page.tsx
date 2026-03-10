"use client";

import { SplashScreen } from "@/components/splash-screen";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <SplashScreen
      onStart={() => router.push("/inicio")}
    />
  );
}
