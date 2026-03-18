"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, FolderOpen, Play, ChevronLeft, Edit2, Plus } from "lucide-react";
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
  const [setName, setSetName] = useState("");
  const [state, setState] = useState<CrearState>("idle");
  const [createdCount, setCreatedCount] = useState(0);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdCards, setCreatedCards] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 1024;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
  }

  async function handleCreate() {
    if (!imageUrl || state !== "idle") return;

    const finalName = setName.trim() || "Set sin nombre";
    setSetName(finalName);
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
                const { error } = await supabase.from("sets").insert({
                  id: id,
                  user_id: user.id,
                  name: finalName,
                  cards: cardsWithIds,
                  is_favorite: false,
                  is_public: false,
                  progress: 0,
                });

                if (error) {
                  console.error("[Crear] Supabase insert error:", error);
                }
              } catch (insertErr) {
                console.error("[Crear] Supabase insert threw exception:", insertErr);
              }
            }
          } catch (err) {
            console.error("[Crear] Supabase auth check failed:", err);
          }

          setCreatedCount(cards.length);
          setCreatedId(id);
          setCreatedCards(cardsWithIds);
          setState("success");
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
    setSetName("");
    setState("idle");
    setCreatedCount(0);
    setCreatedCards([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleGoBack() {
    handleReset();
  }

  function handleSaveSet() {
    if (createdId) {
      router.push(`/estudiar/${createdId}`);
    }
  }

  function handleGoHome() {
    handleReset();
    onNavigate("inicio");
  }

  const canCreate = !!imageUrl && state === "idle";

  // ===== PASO 1: UPLOAD IMAGE =====
  const Step1Content = () => (
    <div style={{ padding: `0 ${H_PAD}px` }}>
      {/* Progress bar */}
      <div style={{
        display: "flex",
        gap: "4px",
        marginBottom: "24px",
      }}>
        <div style={{
          flex: 1,
          height: "3px",
          background: TEXT_PRI,
          borderRadius: "2px",
        }} />
        <div style={{
          flex: 1,
          height: "3px",
          background: BORDER,
          borderRadius: "2px",
        }} />
      </div>

      {/* Title and subtitle */}
      <h1 style={{
        fontFamily: FONT_UI,
        fontSize: "28px",
        fontWeight: 800,
        letterSpacing: "-0.02em",
        color: TEXT_PRI,
        margin: "0 0 8px 0",
      }}>
        Crear set
      </h1>
      <p style={{
        fontFamily: FONT_UI,
        fontSize: "13px",
        fontWeight: 400,
        color: TEXT_SEC,
        margin: "0 0 24px 0",
      }}>
        Paso 1 de 2 • Sube tu imagen
      </p>

      {/* Upload zone */}
      <div style={{
        border: `2px dashed ${SKY}`,
        borderRadius: CARD_RADIUS,
        padding: "32px 16px",
        textAlign: "center",
        marginBottom: SECTION_GAP,
        background: "#F0F5FF",
        cursor: "pointer",
      }} onClick={() => fileInputRef.current?.click()}>
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "16px",
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ stroke: SKY, strokeWidth: 1.5 }}>
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <circle cx="9" cy="9" r="2" fill="currentColor" />
            <path d="M21 15l-5-5-11 11" />
          </svg>
        </div>
        <h3 style={{
          fontFamily: FONT_UI,
          fontSize: "16px",
          fontWeight: 700,
          color: TEXT_PRI,
          margin: "0 0 8px 0",
        }}>
          Toca para subir foto
        </h3>
        <p style={{
          fontFamily: FONT_UI,
          fontSize: "11px",
          fontWeight: 400,
          color: TEXT_SEC,
          margin: "0 0 6px 0",
        }}>
          JPG, PNG • hasta 10 MB
        </p>
        <p style={{
          fontFamily: FONT_UI,
          fontSize: "11px",
          fontWeight: 400,
          color: TEXT_SEC,
          margin: 0,
        }}>
          Luz clara • texto legible
        </p>
      </div>

      {/* Image preview */}
      {imageUrl && (
        <div style={{
          background: "#F5F5F5",
          border: `0.5px solid ${BORDER}`,
          borderRadius: CARD_RADIUS,
          padding: "16px",
          marginBottom: SECTION_GAP,
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
        }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img
              src={imageUrl}
              alt="Preview"
              style={{
                width: "60px",
                height: "60px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
            <div style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: SAGE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #fff",
            }}>
              <Check style={{ width: "10px", height: "10px", color: "#fff", strokeWidth: 3 }} />
            </div>
          </div>
          <div>
            <h4 style={{
              fontFamily: FONT_UI,
              fontSize: "13px",
              fontWeight: 700,
              color: TEXT_PRI,
              margin: "0 0 4px 0",
            }}>
              Tu foto debe verse así
            </h4>
            <p style={{
              fontFamily: FONT_UI,
              fontSize: "11px",
              fontWeight: 400,
              color: TEXT_SEC,
              margin: 0,
            }}>
              Lista visible, bien iluminada y sin sombras
            </p>
          </div>
        </div>
      )}

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
          gap: "4px",
          marginBottom: SECTION_GAP,
        }}
      >
        <Plus style={{ width: "16px", height: "16px" }} />
        Agregar palabras manualmente
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
      <div style={{
        position: "relative",
        marginBottom: SECTION_GAP,
      }}>
        <input
          type="text"
          value={setName}
          onChange={(e) => setSetName(e.target.value)}
          placeholder="Ej. Biología · Cap. 3"
          style={{
            width: "100%",
            fontFamily: FONT_UI,
            fontSize: "13px",
            padding: "12px 12px",
            border: `0.5px solid ${BORDER}`,
            borderRadius: "8px",
            boxSizing: "border-box",
            background: "#F5F5F5",
          }}
        />
        <Edit2 style={{
          position: "absolute",
          right: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "16px",
          height: "16px",
          color: TEXT_SEC,
          pointerEvents: "none",
        }} />
      </div>

      {/* Checklist */}
      <div style={{
        background: "#F5F5F5",
        border: `0.5px solid ${BORDER}`,
        borderRadius: CARD_RADIUS,
        padding: "16px",
        marginBottom: SECTION_GAP,
      }}>
        <p style={{
          fontFamily: FONT_UI,
          fontSize: "11px",
          fontWeight: 700,
          color: TEXT_SEC,
          margin: "0 0 12px 0",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          Para continuar necesitas:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontFamily: FONT_UI,
            fontSize: "13px",
            color: imageUrl ? TEXT_PRI : TEXT_SEC,
          }}>
            <input
              type="checkbox"
              checked={!!imageUrl}
              readOnly
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer",
                accentColor: SAGE,
              }}
            />
            Subir una imagen
          </label>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontFamily: FONT_UI,
            fontSize: "13px",
            color: setName ? TEXT_PRI : TEXT_SEC,
          }}>
            <input
              type="checkbox"
              checked={!!setName}
              readOnly
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer",
                accentColor: SAGE,
              }}
            />
            Nombrar el set
          </label>
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={handleCreate}
        disabled={!canCreate || state === "loading"}
        style={{
          width: "100%",
          background: canCreate ? TEXT_PRI : BORDER,
          border: "none",
          borderRadius: "9999px",
          padding: "14px 20px",
          fontFamily: FONT_UI,
          fontSize: "14px",
          fontWeight: 700,
          color: "#fff",
          cursor: canCreate ? "pointer" : "not-allowed",
          opacity: canCreate ? 1 : 0.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {state === "loading" ? "Procesando..." : "Continuar →"}
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

  // ===== PASO 2: REVIEW CARDS =====
  const Step2Content = () => (
    <div style={{ padding: `0 ${H_PAD}px` }}>
      {/* Back button and progress */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "24px",
      }}>
        <button
          onClick={handleGoBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 0",
            fontFamily: FONT_UI,
            fontSize: "13px",
            fontWeight: 600,
            color: TEXT_SEC,
          }}
        >
          <ChevronLeft style={{ width: "18px", height: "18px" }} />
          Volver
        </button>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: "4px", flex: 1, marginLeft: "16px" }}>
          <div style={{
            flex: 1,
            height: "3px",
            background: TEXT_PRI,
            borderRadius: "2px",
          }} />
          <div style={{
            flex: 1,
            height: "3px",
            background: TEXT_PRI,
            borderRadius: "2px",
          }} />
        </div>
      </div>

      {/* Title and subtitle */}
      <h1 style={{
        fontFamily: FONT_UI,
        fontSize: "28px",
        fontWeight: 800,
        letterSpacing: "-0.02em",
        color: TEXT_PRI,
        margin: "0 0 8px 0",
      }}>
        Revisar set
      </h1>
      <p style={{
        fontFamily: FONT_UI,
        fontSize: "13px",
        fontWeight: 400,
        color: TEXT_SEC,
        margin: "0 0 24px 0",
      }}>
        Paso 2 de 2 • Confirma tus tarjetas
      </p>

      {/* Set name badge */}
      <div style={{
        background: SKY,
        borderRadius: "8px",
        padding: "8px 12px",
        fontFamily: FONT_UI,
        fontSize: "12px",
        fontWeight: 700,
        color: TEXT_PRI,
        marginBottom: "16px",
        display: "inline-block",
      }}>
        {setName || "Sin nombre"}
      </div>

      {/* Cards detected header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
      }}>
        <h2 style={{
          fontFamily: FONT_UI,
          fontSize: "14px",
          fontWeight: 700,
          color: TEXT_PRI,
          margin: 0,
        }}>
          Tarjetas detectadas
        </h2>
        <div style={{
          background: SAGE,
          borderRadius: "9999px",
          padding: "4px 10px",
          fontFamily: FONT_UI,
          fontSize: "11px",
          fontWeight: 700,
          color: "#fff",
        }}>
          {createdCount} tarjetas
        </div>
      </div>

      {/* Cards list */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginBottom: SECTION_GAP,
      }}>
        {createdCards.map((card, idx) => (
          <div
            key={card.id || idx}
            onClick={() => setEditingCardId(card.id || idx.toString())}
            style={{
              background: editingCardId === (card.id || idx.toString()) ? ROSE : "#fff",
              border: `0.5px solid ${BORDER}`,
              borderRadius: CARD_RADIUS,
              padding: "12px 14px",
              cursor: "pointer",
            }}
          >
            <h4 style={{
              fontFamily: FONT_UI,
              fontSize: "14px",
              fontWeight: 700,
              color: editingCardId === (card.id || idx.toString()) ? "#7A3550" : TEXT_PRI,
              margin: "0 0 4px 0",
            }}>
              {card.spanish || card.kanji || "Sin título"}
            </h4>
            <p style={{
              fontFamily: FONT_UI,
              fontSize: "11px",
              fontWeight: 400,
              color: editingCardId === (card.id || idx.toString()) ? "#7A3550" : TEXT_SEC,
              margin: 0,
            }}>
              {card.example_usage || "Sin descripción"}
            </p>
            {editingCardId === (card.id || idx.toString()) && (
              <p style={{
                fontFamily: FONT_UI,
                fontSize: "11px",
                fontWeight: 700,
                color: "#7A3550",
                margin: "6px 0 0 0",
              }}>
                Toca para editar
              </p>
            )}
          </div>
        ))}
      </div>

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
          gap: "4px",
          marginBottom: SECTION_GAP,
        }}
      >
        <Plus style={{ width: "16px", height: "16px" }} />
        Agregar tarjeta manualmente
      </button>

      {/* Save button */}
      <button
        onClick={handleSaveSet}
        style={{
          width: "100%",
          background: TEXT_PRI,
          border: "none",
          borderRadius: "9999px",
          padding: "14px 20px",
          fontFamily: FONT_UI,
          fontSize: "14px",
          fontWeight: 700,
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        Guardar set →
      </button>
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
        {state === "success" ? <Step2Content /> : <Step1Content />}
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
            {state === "success" ? <Step2Content /> : <Step1Content />}
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
