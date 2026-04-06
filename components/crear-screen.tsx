"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AppSidebar } from "./app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { createClient } from "@/lib/supabase";
import { tokens } from "@/lib/design-tokens";
import { PageTitle } from "@/components/ui/page-title";

// ── Design tokens ─────────────────────────────────────────────────────
const FONT_UI = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const BG_PAGE = tokens.color.page;
const TEXT_PRI = tokens.color.ink;
const TEXT_SEC = tokens.color.muted;
const SKY = tokens.color.sky;
const SKY_LIGHT = tokens.color.bgSkyLight;
const BORDER = tokens.color.border;
const H_PAD = tokens.spacing["4"];     // 16px
const CARD_RADIUS = tokens.radius.card;  // 14px

type CrearState = "idle" | "loading" | "success";

export interface DeckSet {
  id: string;
  title: string;
  cardCount: number;
  progress: number;
  lastStudied: string;
  cards: Array<{ id?: string; kana: string; kanji: string; spanish: string; example_usage: string }>;
}

interface CrearScreenProps {
  onNavigate: (tab: "inicio" | "crear" | "progreso") => void;
}

// ── useWindowSize Hook ────────────────────────────────────────────────────
function useWindowSize() {
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return mounted ? windowWidth : 1024;
}

export function CrearScreen({ onNavigate }: CrearScreenProps) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [setName, setSetName] = useState("");
  const [state, setState] = useState<CrearState>("idle");
  const [createdCards, setCreatedCards] = useState<any[]>([]);
  const [limitError, setLimitError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 1024;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
    setImageName(file.name);
  }

  function handleRemoveImage() {
    setImageUrl(null);
    setImageName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleGenerate() {
    if (!imageUrl || state !== "idle" || !setName.trim()) return;

    // Check set limit before proceeding
    const MAX_SETS = 3;
    const existingSets = JSON.parse(localStorage.getItem("vocab_sets") || "[]");
    if (existingSets.length >= MAX_SETS) {
      setLimitError(true);
      return;
    }
    setLimitError(false);

    const finalName = setName.trim();
    setState("loading");

    try {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setState("idle");
          return;
        }
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL("image/jpeg").split(",")[1];

        try {
          const response = await fetch("/api/extract-vocab", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64 }),
          });

          if (!response.ok) throw new Error("API error");

          const data = await response.json();
          const cards = data.cards || [];
          const id = crypto.randomUUID();

          const cardsWithIds = cards.map((card, index) => ({
            id: index.toString(),
            ...card,
          }));

          const newSet: DeckSet = {
            id,
            title: finalName,
            cardCount: cards.length,
            progress: 0,
            lastStudied: new Date().toISOString(),
            cards: cardsWithIds,
            favorite: false,
          };

          try {
            const existingSets = JSON.parse(localStorage.getItem("vocab_sets") || "[]");
            const updatedSets = [...existingSets, newSet];
            localStorage.setItem("vocab_sets", JSON.stringify(updatedSets));
          } catch (err) {
            console.error("[Crear] localStorage error:", err);
          }

          try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
              try {
                await supabase.from("sets").insert({
                  id: id,
                  user_id: user.id,
                  name: finalName,
                  cards: cardsWithIds,
                  is_favorite: false,
                  is_public: false,
                  progress: 0,
                });
              } catch (insertErr) {
                console.error("[Crear] Supabase insert error:", insertErr);
              }
            }
          } catch (err) {
            console.error("[Crear] Supabase error:", err);
          }

          setCreatedCards(cardsWithIds);
          setState("success");

          // Redirect to study
          setTimeout(() => {
            if (id) router.push(`/estudiar/${id}`);
          }, 800);
        } catch (err) {
          setState("idle");
        }
      };
      img.src = imageUrl;
    } catch (err) {
      setState("idle");
    }
  }

  const existingSetsCount = JSON.parse(localStorage.getItem("vocab_sets") || "[]").length;
  const canGenerate = !!imageUrl && !!setName.trim() && state === "idle" && existingSetsCount < 3;

  // ===== Main Content =====
  const mainContent = (
    <div style={{ padding: `0 ${H_PAD}px` }}>
      {/* Title */}
      <PageTitle>Nuevo set</PageTitle>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${SKY}`,
          borderRadius: "24px",
          padding: "48px 24px",
          textAlign: "center",
          marginBottom: "32px",
          background: SKY_LIGHT,
          cursor: "pointer",
          position: "relative",
          minHeight: "320px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
        }}
      >
        {!imageUrl ? (
          <>
            {/* Icon Circle */}
            <div style={{
              width: "72px",
              height: "72px",
              background: tokens.color.surface,
              borderRadius: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ stroke: SKY, strokeWidth: 1.5 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                <path d="M21 15l-5-5-11 11" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Text */}
            <div>
              <h2 style={{
                fontFamily: FONT_UI,
                fontSize: "16px",
                fontWeight: 700,
                color: tokens.color.sky,
                margin: "0 0 6px 0",
              }}>
                Subir foto
              </h2>
              <p style={{
                fontFamily: FONT_UI,
                fontSize: "13px",
                fontWeight: 400,
                color: tokens.color.sky,
                margin: 0,
              }}>
                Kanji, hiragana o rōmaji
              </p>
            </div>
          </>
        ) : (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              background: tokens.color.surface,
              borderRadius: "12px",
              flexShrink: 0,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }} />
            <div style={{ flex: 1, textAlign: "left" }}>
              <p style={{
                fontFamily: FONT_UI,
                fontSize: "12px",
                fontWeight: 600,
                color: tokens.color.textSuccess,
                margin: "0 0 2px 0",
              }}>
                ✓ Imagen lista
              </p>
              <p style={{
                fontFamily: FONT_UI,
                fontSize: "11px",
                fontWeight: 400,
                color: tokens.color.textSuccess,
                margin: 0,
              }}>
                {imageName}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                padding: 0,
                color: tokens.color.textSuccess,
                flexShrink: 0,
              }}
            >
              <X style={{ width: "20px", height: "20px" }} />
            </button>
          </div>
        )}
      </div>

      {/* Set Name Input */}
      <label style={{
        fontFamily: FONT_UI,
        fontSize: "13px",
        fontWeight: 700,
        color: TEXT_PRI,
        display: "block",
        marginBottom: "12px",
      }}>
        Nombre del set
      </label>
      <input
        type="text"
        value={setName}
        onChange={(e) => setSetName(e.target.value)}
        placeholder="Nombre del set"
        style={{
          width: "100%",
          fontFamily: FONT_UI,
          fontSize: "14px",
          padding: "14px 16px",
          border: `0.5px solid ${BORDER}`,
          borderRadius: "12px",
          boxSizing: "border-box",
          background: "#fff",
          color: TEXT_PRI,
          marginBottom: "32px",
        }}
      />

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        style={{
          width: "100%",
          background: canGenerate ? TEXT_PRI : tokens.color.bgGrey,
          border: "none",
          borderRadius: "16px",
          padding: "16px 20px",
          fontFamily: FONT_UI,
          fontSize: "15px",
          fontWeight: 700,
          color: canGenerate ? tokens.color.surface : TEXT_SEC,
          cursor: canGenerate ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {state === "loading" ? "Procesando..." : "Generar tarjetas →"}
      </button>

      {limitError && (
        <p style={{
          fontSize: "13px",
          fontWeight: 600,
          color: tokens.color.textError,
          textAlign: "center",
          marginTop: "12px",
        }}>
          Has alcanzado el límite de 3 sets. Mejora tu plan para crear más.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );

  // ===== MOBILE LAYOUT =====
  const mobileContent = (
    <div style={{
      height: "100dvh",
      maxWidth: "375px",
      margin: "0 auto",
      background: BG_PAGE,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Safe-area top */}
      <div aria-hidden style={{
        flexShrink: 0,
        height: "max(16px, env(safe-area-inset-top, 0px))",
      }} />

      {/* Scrollable content */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        height: "0",
        paddingBottom: "100px",
      }}>
        {mainContent}
      </div>

      {/* Bottom navigation */}
      <BottomNav active="crear" onNavigate={onNavigate} />

      {/* iOS home indicator */}
      <div aria-hidden style={{
        flexShrink: 0,
        background: "#fff",
        display: "flex",
        justifyContent: "center",
        paddingTop: "4px",
        paddingBottom: "max(6px, env(safe-area-inset-bottom, 6px))",
      }}>
        <div style={{
          width: "134px",
          height: "5px",
          borderRadius: "99px",
          background: tokens.color.progressIndent,
        }} />
      </div>
    </div>
  );

  // ===== DESKTOP LAYOUT =====
  const desktopContent = (
    <div style={{
      height: "100dvh",
      background: BG_PAGE,
      display: "flex",
      flexDirection: "row",
    }}>
      <AppSidebar activeTab="crear" onNavigate={onNavigate} />

      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}>
        <div aria-hidden style={{
          flexShrink: 0,
          height: "max(16px, env(safe-area-inset-top, 0px))",
        }} />

        <div style={{
          flex: 1,
          overflowY: "scroll",
          WebkitOverflowScrolling: "touch",
          height: "100vh",
          paddingBottom: "40px",
        }}>
          <div style={{
            maxWidth: "680px",
            margin: "0 auto",
            width: "100%",
          }}>
            {mainContent}
          </div>
        </div>
      </div>
    </div>
  );

  return isMobile ? mobileContent : desktopContent;
}

