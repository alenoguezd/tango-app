"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Plus } from "lucide-react";
import { AppSidebar } from "./app-sidebar";
import { createClient } from "@/lib/supabase";
import { tokens } from "@/lib/design-tokens";

// ── Design tokens ─────────────────────────────────────────────────────────
const FONT_UI = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const BG_PAGE = "#FAFAF8";
const TEXT_PRI = "#1A1A1A";
const TEXT_SEC = "#B0A898";
const SAGE = "#A8C87A";
const ROSE = "#F2B8CD";
const SKY = "#B8CEEA";
const SKY_LIGHT = "#E8F2F9";
const SAGE_LIGHT = "#E8F4D8";
const BORDER = "#EEEBE6";
const H_PAD = 16;
const SECTION_GAP = 24;
const CARD_RADIUS = 14;

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
  const [createdCount, setCreatedCount] = useState(0);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdCards, setCreatedCards] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
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

    const finalName = setName.trim();
    setState("loading");
    setError(null);

    try {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Error procesando imagen");
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
            console.error("[Crear] Failed to save to localStorage:", err);
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
            console.error("[Crear] Supabase auth check failed:", err);
          }

          setCreatedCount(cards.length);
          setCreatedId(id);
          setCreatedCards(cardsWithIds);
          setState("success");

          // Navigate to study screen after success
          setTimeout(() => {
            if (id) router.push(`/estudiar/${id}`);
          }, 800);
        } catch (err) {
          setError("Error al procesar imagen");
          setState("idle");
        }
      };
      img.src = imageUrl;
    } catch (err) {
      setError("Error al procesar imagen");
      setState("idle");
    }
  }

  function handleReset() {
    setImageUrl(null);
    setImageName(null);
    setSetName("");
    setState("idle");
    setCreatedCount(0);
    setCreatedCards([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleGoHome() {
    handleReset();
    onNavigate("inicio");
  }

  const canGenerate = !!imageUrl && !!setName.trim() && state === "idle";

  // ===== Main Content (memoized to prevent re-renders) =====
  const mainContent = (
    <div style={{ padding: `0 ${H_PAD}px` }}>
      {/* Title */}
      <h1 style={{
        fontFamily: FONT_UI,
        fontSize: "28px",
        fontWeight: 800,
        letterSpacing: "-0.02em",
        color: TEXT_PRI,
        margin: "0 0 8px 0",
      }}>
        Nuevo set
      </h1>

      {/* Subtitle */}
      <p style={{
        fontFamily: FONT_UI,
        fontSize: "13px",
        fontWeight: 400,
        color: TEXT_SEC,
        margin: "0 0 24px 0",
      }}>
        Crea tus tarjetas de japonés en segundos
      </p>

      {/* Upload zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${imageUrl ? SAGE : SKY}`,
          borderRadius: CARD_RADIUS,
          padding: "24px 16px",
          textAlign: "center",
          marginBottom: SECTION_GAP,
          background: imageUrl ? SAGE_LIGHT : SKY_LIGHT,
          cursor: "pointer",
          position: "relative",
        }}
      >
        {!imageUrl ? (
          <>
            <div style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "12px",
            }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" style={{ stroke: SKY, strokeWidth: 1.5 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                <path d="M21 15l-5-5-11 11" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 style={{
              fontFamily: FONT_UI,
              fontSize: "14px",
              fontWeight: 700,
              color: "#1565C0",
              margin: "0 0 6px 0",
            }}>
              Fotografía tu lista de vocabulario
            </h3>
            <p style={{
              fontFamily: FONT_UI,
              fontSize: "11px",
              fontWeight: 400,
              color: "#1565C0",
              margin: "0 0 4px 0",
            }}>
              Kanji, hiragana o rōmaji — lo detectamos todo
            </p>
            <p style={{
              fontFamily: FONT_UI,
              fontSize: "11px",
              fontWeight: 400,
              color: "#1565C0",
              margin: 0,
            }}>
              JPG · PNG · hasta 10 MB
            </p>
          </>
        ) : (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              background: "#fff",
              borderRadius: "8px",
              flexShrink: 0,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ stroke: SAGE, strokeWidth: 1.5 }}>
                <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <h4 style={{
                fontFamily: FONT_UI,
                fontSize: "13px",
                fontWeight: 700,
                color: "#2A5010",
                margin: "0 0 2px 0",
              }}>
                ¡Imagen lista!
              </h4>
              <p style={{
                fontFamily: FONT_UI,
                fontSize: "11px",
                fontWeight: 400,
                color: "#2A5010",
                margin: 0,
              }}>
                {imageName} · detectando palabras...
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
                color: "#2A5010",
                flexShrink: 0,
              }}
            >
              <X style={{ width: "20px", height: "20px" }} />
            </button>
          </div>
        )}
      </div>

      {/* Info card */}
      {!imageUrl && (
        <div style={{
          background: "#fff",
          border: `0.5px solid ${BORDER}`,
          borderRadius: "10px",
          padding: "12px 14px",
          marginBottom: "16px",
          display: "flex",
          gap: "10px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            background: SKY_LIGHT,
            borderRadius: "6px",
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ stroke: SKY, strokeWidth: 1.5 }}>
              <line x1="5" y1="8" x2="19" y2="8" strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
              <line x1="5" y1="16" x2="19" y2="16" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h4 style={{
              fontFamily: FONT_UI,
              fontSize: "13px",
              fontWeight: 700,
              color: TEXT_PRI,
              margin: "0 0 2px 0",
            }}>
              Consejo para mejor detección
            </h4>
            <p style={{
              fontFamily: FONT_UI,
              fontSize: "11px",
              fontWeight: 400,
              color: TEXT_SEC,
              margin: 0,
            }}>
              Buena luz, texto plano y sin sombras
            </p>
          </div>
        </div>
      )}

      {/* Divider or link */}
      <p style={{
        fontFamily: FONT_UI,
        fontSize: "11px",
        fontWeight: 400,
        color: TEXT_SEC,
        textAlign: "center",
        margin: "0 0 16px 0",
      }}>
        o escribe tú mismo
      </p>

      {/* Add manually link */}
      <button
        onClick={() => {}}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: FONT_UI,
          fontSize: "13px",
          fontWeight: 600,
          color: TEXT_SEC,
          padding: "8px 0",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: SECTION_GAP,
        }}
      >
        <span style={{ fontSize: "14px" }}>🖊</span>
        Agregar palabras a mano
      </button>

      {/* Set name input */}
      <label style={{
        fontFamily: FONT_UI,
        fontSize: "13px",
        fontWeight: 700,
        color: TEXT_PRI,
        display: "block",
        marginBottom: "8px",
      }}>
        Nombre del set
      </label>
      <input
        type="text"
        value={setName}
        onChange={(e) => setSetName(e.target.value)}
        placeholder="Ej. N5 · Verbos · Lección 3"
        style={{
          width: "100%",
          fontFamily: FONT_UI,
          fontSize: "13px",
          padding: "12px 12px",
          border: imageUrl ? `2px solid ${SAGE}` : `0.5px solid ${BORDER}`,
          borderRadius: "8px",
          boxSizing: "border-box",
          background: "#fff",
          color: TEXT_PRI,
          marginBottom: SECTION_GAP,
        }}
      />

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        style={{
          width: "100%",
          background: canGenerate ? TEXT_PRI : "#D9D9D9",
          border: "none",
          borderRadius: "9999px",
          padding: "14px 20px",
          fontFamily: FONT_UI,
          fontSize: "14px",
          fontWeight: 700,
          color: "#fff",
          cursor: canGenerate ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {state === "loading" ? "Procesando..." : "Generar tarjetas →"}
      </button>

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
        overflowY: "scroll",
        WebkitOverflowScrolling: "touch",
        height: "0",
        paddingBottom: "100px",
      }}>
        {mainContent}
      </div>

      {/* Bottom navigation */}
      <nav style={{
        flexShrink: 0,
        width: "100%",
        background: "#fff",
        borderTop: `1px solid ${BORDER}`,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-around",
        paddingTop: "10px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px) + 8px)",
      }}>
        <NavItem label="Inicio" active={false} icon={<HomeIcon />} onClick={() => handleGoHome()} />
        <NavItem label="Crear" active icon={<CreateIcon />} onClick={() => {}} />
        <NavItem label="Progreso" active={false} icon={<PlayIcon />} onClick={() => onNavigate("progreso")} />
        <NavItem label="Perfil" active={false} icon={<PersonIcon />} onClick={() => onNavigate("perfil")} />
      </nav>

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
          background: "#111",
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

// ── NavItem ────────────────────────────────────────────────────────────────────
function NavItem({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "3px",
        minHeight: "48px",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <div style={{
        width: active ? "64px" : "44px",
        height: "32px",
        borderRadius: "16px",
        background: active ? "#F0F0F0" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? "#1A1A1A" : "#B0A898",
        transition: "width 0.15s ease",
      }}>
        {icon}
      </div>
      <span style={{
        fontFamily: FONT_UI,
        fontSize: "11px",
        fontWeight: active ? 700 : 400,
        color: active ? "#1A1A1A" : "#B0A898",
      }}>
        {label}
      </span>
    </button>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CreateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.8" />
      <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 20c0-4.418 4.03-8 9-8s9 3.582 9 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
