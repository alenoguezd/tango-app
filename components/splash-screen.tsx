"use client";

import Image from "next/image";

interface SplashScreenProps {
  onStart: () => void;
}

export function SplashScreen({ onStart }: SplashScreenProps) {
  return (
    <div
      className="flex flex-col w-full select-none"
      style={{ height: "100dvh", background: "#FFFFFF", overflow: "hidden" }}
    >
      {/* Illustration — top ~55% */}
      <div className="relative w-full flex-shrink-0" style={{ height: "55dvh" }}>
        <Image
          src="/splash-illustration.jpg"
          alt="Hands holding a Japanese flashcard binder on a train"
          fill
          priority
          sizes="390px"
          style={{ objectFit: "cover", objectPosition: "center top" }}
        />
      </div>

      {/* Bottom content */}
      <div
        className="flex flex-col items-center justify-between flex-1 px-6"
        style={{
          paddingTop: "clamp(28px, 5dvh, 52px)",
          paddingBottom: "max(36px, env(safe-area-inset-bottom, 16px) + 20px)",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <h1
            className="text-center leading-tight text-balance"
            style={{
              fontFamily: "var(--font-japanese), var(--font-sans)",
              fontSize: "clamp(2rem, 8vw, 2.75rem)",
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: "-0.02em",
            }}
          >
            単語
          </h1>
          <p
            className="text-center text-balance"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.9375rem",
              fontWeight: 400,
              color: "#6B6B6B",
              lineHeight: 1.5,
            }}
          >
            Aprende japonés con tus propias palabras
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          className="w-full flex items-center justify-center transition-all duration-150 active:scale-95 active:opacity-90"
          style={{
            height: "56px",
            borderRadius: "14px",
            background: "#1A6B8A",
            color: "#FFFFFF",
            fontSize: "1rem",
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            letterSpacing: "0.01em",
          }}
          aria-label="Empezar a estudiar"
        >
          Empezar
        </button>
      </div>
    </div>
  );
}
