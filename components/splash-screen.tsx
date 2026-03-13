"use client";

import Image from "next/image";

interface SplashScreenProps {
  onStart: () => void;
}

export function SplashScreen({ onStart }: SplashScreenProps) {
  return (
    <>
      {/* ===== MOBILE LAYOUT (< 768px) ===== */}
      <div
        className="flex flex-col w-full select-none md:hidden"
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

      {/* ===== DESKTOP LAYOUT (≥ 768px) ===== */}
      <div
        className="hidden md:flex w-full select-none"
        style={{ height: "100dvh", background: "#FFFFFF", overflow: "hidden" }}
      >
        {/* Left half (50%): Illustration fills full height */}
        <div className="relative w-1/2 h-full flex-shrink-0">
          <Image
            src="/splash-illustration.jpg"
            alt="Hands holding a Japanese flashcard binder on a train"
            fill
            priority
            sizes="50vw"
            style={{ objectFit: "cover" }}
          />
        </div>

        {/* Right half (50%): Content centered on white background */}
        <div
          className="w-1/2 flex items-center justify-center"
          style={{ background: "#FFFFFF" }}
        >
          <div
            className="flex flex-col items-center"
            style={{ maxWidth: "300px", gap: "32px" }}
          >
            {/* App name: large and bold */}
            <h1
              style={{
                fontFamily: "var(--font-japanese), var(--font-sans)",
                fontSize: "3.5rem",
                fontWeight: 700,
                color: "#1A1A1A",
                letterSpacing: "-0.02em",
                textAlign: "center",
                margin: 0,
                lineHeight: 1,
              }}
            >
              単語
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "1.0625rem",
                fontWeight: 400,
                color: "#6B6B6B",
                lineHeight: 1.6,
                textAlign: "center",
                margin: 0,
              }}
            >
              Aprende japonés con tus propias palabras
            </p>

            {/* Button */}
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
                border: "none",
                cursor: "pointer",
              }}
              aria-label="Empezar a estudiar"
            >
              Empezar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
