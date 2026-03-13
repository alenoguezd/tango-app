"use client";

import { useEffect, useState, useRef } from "react";
import { Check, FolderOpen, Play, ImagePlus } from "lucide-react";
import { AppSidebar } from "./app-sidebar";
import { createClient } from "@/lib/supabase";

// ── Design tokens ─────────────────────────────────────────────────────────
const FONT        = "var(--font-sans)";
const BG_PAGE     = "#FFFFFF";
const TEXT_PRI    = "#1D1B20";
const TEXT_SEC    = "#555555";
const TEXT_MUT    = "#9A9A9A";
const NAV_PILL    = "#EBEBEB";
const TEAL_BTN    = "#1A6B8A";
const TEAL_BTN_SH = "#124557";
const UPLOAD_BG   = "#E8EEF6";
const UPLOAD_DASH = "#B8CCE4";
const H_PAD       = 16;
const SECTION_GAP = 24;

type CrearState = "idle" | "loading" | "success";

export interface DeckSet {
  id: string;
  title: string;
  cardCount: number;
  progress: number;
  lastStudied: string;
  cards: Array<{ kana: string; kanji: string; spanish: string; example_usage: string }>;
}

interface CrearScreenProps {
  onNavigate: (tab: "inicio" | "crear" | "progreso") => void;
}

// ── useWindowSize Hook ────────────────────────────────────────────────────
function useWindowSize() {
  const [windowWidth, setWindowWidth] = useState<number>(1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowWidth;
}

export function CrearScreen({ onNavigate }: CrearScreenProps) {
  const [imageUrl, setImageUrl]         = useState<string | null>(null);
  const [setName, setSetName]           = useState("");
  const [state, setState]               = useState<CrearState>("idle");
  const [createdCount, setCreatedCount] = useState(0);
  const [createdId, setCreatedId]       = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);
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
      // Convert image to base64
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

        // Call API
        try {
          const response = await fetch("/api/extract-vocab", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64 }),
          });

          if (!response.ok) {
            throw new Error("API error");
          }

          const data = await response.json();
          const cards = data.cards || [];
          const id = Date.now().toString();

          // Add unique IDs to each card
          const cardsWithIds = cards.map((card, index) => ({
            id: index.toString(),
            ...card,
          }));

          // Save to localStorage
          const newSet: DeckSet = {
            id,
            title: finalName,
            cardCount: cards.length,
            progress: 0,
            lastStudied: new Date().toISOString(),
            cards: cardsWithIds,
          };

          // Save to localStorage
          const sets = JSON.parse(localStorage.getItem("vocab_sets") || "[]");
          sets.push(newSet);
          localStorage.setItem("vocab_sets", JSON.stringify(sets));

          // Try to save to Supabase
          try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
              await supabase.from("sets").insert({
                id: id,
                user_id: user.id,
                title: finalName,
                card_count: cards.length,
                cards: cardsWithIds,
                is_public: false,
              });
            }
          } catch (err) {
            console.log("Supabase save failed, using localStorage fallback");
          }

          setCreatedCount(cards.length);
          setCreatedId(id);
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
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleStudyNew() {
    if (createdId) {
      // Save current set ID and navigate to home
      localStorage.setItem("currentSetId", createdId);
      handleReset();
      onNavigate("inicio");
    }
  }

  function handleGoHome() {
    handleReset();
    onNavigate("inicio");
  }

  const canCreate = !!imageUrl && state === "idle";

  // ===== MOBILE LAYOUT (< 1024px) =====
  const mobileContent = (
    <div style={{
      height: "100dvh",
      maxWidth: "375px",
      margin: "0 auto",
      background: BG_PAGE,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Safe-area top spacer */}
      <div aria-hidden style={{
        flexShrink: 0,
        height: "max(16px, env(safe-area-inset-top, 0px))",
      }} />

      {/* Scrollable body */}
      <div className="scroll-area" style={{ flex: 1, minHeight: 0 }}>
        <div style={{ padding: `0 ${H_PAD}px` }}>
          <h1 style={{
            fontFamily: FONT,
            fontSize: "36px",
            fontWeight: 500,
            color: TEXT_PRI,
            lineHeight: "44px",
            letterSpacing: "0",
            margin: `8px 0 8px`,
          }}>
            Crea un nuevo set
          </h1>

          <p style={{
            fontFamily: FONT,
            fontSize: "18px",
            fontWeight: 400,
            color: TEXT_PRI,
            textAlign: "left",
            lineHeight: "26px",
            margin: `0 0 ${SECTION_GAP}px`,
          }}>
            Sube una foto de tu lista de palabras
          </p>

          {/* Upload zone */}
          {!imageUrl ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Subir imagen"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "220px",
                background: UPLOAD_BG,
                border: `2px dashed ${UPLOAD_DASH}`,
                borderRadius: "16px",
                cursor: "pointer",
                boxSizing: "border-box",
                marginBottom: `${SECTION_GAP}px`,
              }}
            >
              <ImagePlus
                style={{
                  width: "52px",
                  height: "52px",
                  color: "#4A6FA5",
                  strokeWidth: 1.5,
                }}
              />
            </button>
          ) : (
            <div style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              background: UPLOAD_BG,
              border: `2px dashed ${UPLOAD_DASH}`,
              borderRadius: "16px",
              padding: "16px",
              boxSizing: "border-box",
              gap: "14px",
              marginBottom: `${SECTION_GAP}px`,
            }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src={imageUrl}
                  alt="Vista previa"
                  style={{
                    width: "68px",
                    height: "68px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    display: "block",
                  }}
                />
                <div style={{
                  position: "absolute",
                  top: "-7px",
                  right: "-7px",
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "#22C55E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #fff",
                }}>
                  <Check style={{ width: "11px", height: "11px", color: "#fff", strokeWidth: 3 }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: FONT,
                  fontSize: "15px",
                  fontWeight: 600,
                  color: TEXT_PRI,
                  margin: "0 0 4px",
                }}>
                  Imagen lista
                </p>
                <button
                  onClick={handleReset}
                  style={{
                    fontFamily: FONT,
                    fontSize: "12px",
                    color: TEXT_MUT,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  Cambiar imagen
                </button>
              </div>
            </div>
          )}

          <label style={{
            display: "block",
            fontFamily: FONT,
            fontSize: "15px",
            fontWeight: 500,
            color: TEXT_SEC,
            marginBottom: "8px",
          }}>
            Nombre del set
          </label>

          <input
            type="text"
            placeholder="Lección 32"
            value={setName}
            onChange={e => setSetName(e.target.value)}
            disabled={state !== "idle"}
            style={{
              width: "100%",
              height: "52px",
              borderRadius: "10px",
              border: `1.5px solid #D1D5DB`,
              padding: "0 14px",
              fontFamily: FONT,
              fontSize: "16px",
              color: TEXT_PRI,
              background: "#FFFFFF",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: `${SECTION_GAP}px`,
            }}
          />

          <button
            onClick={handleCreate}
            disabled={!canCreate}
            style={{
              width: "100%",
              height: "56px",
              borderRadius: "14px",
              border: "none",
              background: canCreate ? TEAL_BTN : "#D0D0D0",
              fontFamily: FONT,
              fontSize: "1rem",
              fontWeight: 600,
              color: canCreate ? "#FFFFFF" : "#9A9A9A",
              cursor: canCreate ? "pointer" : "not-allowed",
              transition: "background 0.2s ease, color 0.2s ease",
              letterSpacing: "0.01em",
            }}
          >
            Crear set
          </button>

          <div style={{ height: "32px" }} />
        </div>
      </div>

      {/* Bottom navigation */}
      <nav style={{
        flexShrink: 0,
        width: "100%",
        background: BG_PAGE,
        borderTop: `1px solid #E8E8E8`,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-around",
        paddingTop: "10px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px) + 8px)",
      }}>
        <NavItem label="Inicio" active={false} icon={<SmileIcon />} onClick={() => onNavigate("inicio")} />
        <NavItem label="Crear" active icon={<FolderOpen style={{ width: "22px", height: "22px", strokeWidth: 1.8 }} />} onClick={() => {}} />
        <NavItem label="Progreso" active={false} icon={<Play style={{ width: "20px", height: "20px", strokeWidth: 1.8 }} />} onClick={() => onNavigate("progreso")} />
      </nav>

      {/* iOS home indicator */}
      <div aria-hidden style={{
        flexShrink: 0,
        background: BG_PAGE,
        display: "flex",
        justifyContent: "center",
        paddingTop: "4px",
        paddingBottom: "max(6px, env(safe-area-inset-bottom, 6px))",
      }}>
        <div style={{ width: "134px", height: "5px", borderRadius: "99px", background: "#111" }} />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Loading overlay */}
      {state === "loading" && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255,255,255,0.96)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          zIndex: 20,
        }}>
          <Spinner />
          <p style={{ fontFamily: FONT, fontSize: "18px", fontWeight: 500, color: TEXT_PRI, margin: 0 }}>
            Analizando imagen...
          </p>
          <p style={{ fontFamily: FONT, fontSize: "13px", color: TEXT_MUT, margin: 0 }}>
            Esto puede tomar unos segundos
          </p>
        </div>
      )}

      {/* Success overlay */}
      {state === "success" && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255,255,255,0.97)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: `0 ${H_PAD}px`,
          zIndex: 20,
        }}>
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "#DCFCE7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}>
            <Check style={{ width: "34px", height: "34px", color: "#16A34A", strokeWidth: 2.5 }} />
          </div>
          <p style={{ fontFamily: FONT, fontSize: "24px", fontWeight: 700, color: TEXT_PRI, margin: "0 0 8px", textAlign: "center" }}>
            ¡Set creado!
          </p>
          <p style={{ fontFamily: FONT, fontSize: "14px", color: TEXT_SEC, margin: "0 0 36px", textAlign: "center" }}>
            {setName} · {createdCount} tarjetas
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "300px" }}>
            <button
              onClick={handleStudyNew}
              style={{
                height: "56px", borderRadius: "100px", border: "none",
                background: TEAL_BTN,
                boxShadow: `0 4px 0 ${TEAL_BTN_SH}`,
                fontFamily: FONT, fontSize: "16px",
                fontWeight: 700, color: "#FFFFFF", cursor: "pointer",
              }}
            >
              Estudiar ahora
            </button>
            <button
              onClick={handleGoHome}
              style={{
                height: "56px", borderRadius: "100px",
                border: `1.5px solid #C8D0D8`, background: "transparent",
                fontFamily: FONT, fontSize: "16px", fontWeight: 500,
                color: TEXT_PRI, cursor: "pointer",
              }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ===== DESKTOP LAYOUT (≥ 1024px) =====
  const desktopContent = (
    <div style={{
      height: "100dvh",
      background: "#F7F6F3",
      display: "flex",
      flexDirection: "row",
      overflow: "hidden",
    }}>
      <AppSidebar activeTab="crear" onNavigate={onNavigate} />

      {/* Main content area */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#F7F6F3",
      }}>
        <div aria-hidden style={{
          flexShrink: 0,
          height: "max(16px, env(safe-area-inset-top, 0px))",
        }} />

        <div className="scroll-area" style={{ flex: 1, minHeight: 0 }}>
          <div style={{
            maxWidth: "680px",
            margin: "0 auto",
            padding: `0 ${H_PAD}px`,
            width: "100%",
          }}>
            <h1 style={{
              fontFamily: FONT,
              fontSize: "36px",
              fontWeight: 500,
              color: TEXT_PRI,
              lineHeight: "44px",
              letterSpacing: "0",
              margin: `8px 0 8px`,
            }}>
              Crea un nuevo set
            </h1>

            <p style={{
              fontFamily: FONT,
              fontSize: "18px",
              fontWeight: 400,
              color: TEXT_PRI,
              textAlign: "left",
              lineHeight: "26px",
              margin: `0 0 ${SECTION_GAP}px`,
            }}>
              Sube una foto de tu lista de palabras
            </p>

            {!imageUrl ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Subir imagen"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "220px",
                  background: UPLOAD_BG,
                  border: `2px dashed ${UPLOAD_DASH}`,
                  borderRadius: "16px",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  marginBottom: `${SECTION_GAP}px`,
                }}
              >
                <ImagePlus style={{ width: "52px", height: "52px", color: "#4A6FA5", strokeWidth: 1.5 }} />
              </button>
            ) : (
              <div style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                background: UPLOAD_BG,
                border: `2px dashed ${UPLOAD_DASH}`,
                borderRadius: "16px",
                padding: "16px",
                boxSizing: "border-box",
                gap: "14px",
                marginBottom: `${SECTION_GAP}px`,
              }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={imageUrl}
                    alt="Vista previa"
                    style={{
                      width: "68px",
                      height: "68px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      display: "block",
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    top: "-7px",
                    right: "-7px",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "#22C55E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #fff",
                  }}>
                    <Check style={{ width: "11px", height: "11px", color: "#fff", strokeWidth: 3 }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontFamily: FONT,
                    fontSize: "15px",
                    fontWeight: 600,
                    color: TEXT_PRI,
                    margin: "0 0 4px",
                  }}>
                    Imagen lista
                  </p>
                  <button
                    onClick={handleReset}
                    style={{
                      fontFamily: FONT,
                      fontSize: "12px",
                      color: TEXT_MUT,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    Cambiar imagen
                  </button>
                </div>
              </div>
            )}

            <label style={{
              display: "block",
              fontFamily: FONT,
              fontSize: "15px",
              fontWeight: 500,
              color: TEXT_SEC,
              marginBottom: "8px",
            }}>
              Nombre del set
            </label>

            <input
              type="text"
              placeholder="Lección 32"
              value={setName}
              onChange={e => setSetName(e.target.value)}
              disabled={state !== "idle"}
              style={{
                width: "100%",
                height: "52px",
                borderRadius: "10px",
                border: `1.5px solid #D1D5DB`,
                padding: "0 14px",
                fontFamily: FONT,
                fontSize: "16px",
                color: TEXT_PRI,
                background: "#FFFFFF",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: `${SECTION_GAP}px`,
              }}
            />

            <button
              onClick={handleCreate}
              disabled={!canCreate}
              style={{
                width: "100%",
                height: "56px",
                borderRadius: "14px",
                border: "none",
                background: canCreate ? TEAL_BTN : "#D0D0D0",
                fontFamily: FONT,
                fontSize: "1rem",
                fontWeight: 600,
                color: canCreate ? "#FFFFFF" : "#9A9A9A",
                cursor: canCreate ? "pointer" : "not-allowed",
                transition: "background 0.2s ease, color 0.2s ease",
                letterSpacing: "0.01em",
              }}
            >
              Crear set
            </button>

            <div style={{ height: "32px" }} />
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Loading overlay */}
      {state === "loading" && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(255,255,255,0.96)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          zIndex: 20,
        }}>
          <Spinner />
          <p style={{ fontFamily: FONT, fontSize: "18px", fontWeight: 500, color: TEXT_PRI, margin: 0 }}>
            Analizando imagen...
          </p>
          <p style={{ fontFamily: FONT, fontSize: "13px", color: TEXT_MUT, margin: 0 }}>
            Esto puede tomar unos segundos
          </p>
        </div>
      )}

      {/* Success overlay */}
      {state === "success" && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(255,255,255,0.97)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: `0 ${H_PAD}px`,
          zIndex: 20,
        }}>
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "#DCFCE7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}>
            <Check style={{ width: "34px", height: "34px", color: "#16A34A", strokeWidth: 2.5 }} />
          </div>
          <p style={{ fontFamily: FONT, fontSize: "24px", fontWeight: 700, color: TEXT_PRI, margin: "0 0 8px", textAlign: "center" }}>
            ¡Set creado!
          </p>
          <p style={{ fontFamily: FONT, fontSize: "14px", color: TEXT_SEC, margin: "0 0 36px", textAlign: "center" }}>
            {setName} · {createdCount} tarjetas
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "300px" }}>
            <button
              onClick={handleStudyNew}
              style={{
                height: "56px", borderRadius: "100px", border: "none",
                background: TEAL_BTN,
                boxShadow: `0 4px 0 ${TEAL_BTN_SH}`,
                fontFamily: FONT, fontSize: "16px",
                fontWeight: 700, color: "#FFFFFF", cursor: "pointer",
              }}
            >
              Estudiar ahora
            </button>
            <button
              onClick={handleGoHome}
              style={{
                height: "56px", borderRadius: "100px",
                border: `1.5px solid #C8D0D8`, background: "transparent",
                fontFamily: FONT, fontSize: "16px", fontWeight: 500,
                color: TEXT_PRI, cursor: "pointer",
              }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return isMobile ? mobileContent : desktopContent;
}

// ── NavItem ───────────────────────────────────────────────────────────────
function NavItem({ label, icon, active, onClick }: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", gap: "3px", minHeight: "48px",
        background: "none", border: "none", cursor: "pointer", padding: 0,
      }}
    >
      <div style={{
        width: active ? "64px" : "44px",
        height: "32px",
        borderRadius: "16px",
        background: active ? NAV_PILL : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? TEXT_PRI : TEXT_MUT,
        transition: "width 0.15s ease, background 0.15s ease",
      }}>
        {icon}
      </div>
      <span style={{
        fontFamily: FONT,
        fontSize: "11px",
        fontWeight: active ? 700 : 400,
        color: active ? TEXT_PRI : TEXT_MUT,
      }}>
        {label}
      </span>
    </button>
  );
}

function SmileIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="8.5" cy="10" r="1.25" fill="currentColor" />
      <circle cx="15.5" cy="10" r="1.25" fill="currentColor" />
      <path d="M8.5 14c1.2 1.6 5.8 1.6 7 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden
      style={{ animation: "spin 0.9s linear infinite" }}>
      <circle cx="24" cy="24" r="20" stroke="#E5E7EB" strokeWidth="4" />
      <path d="M44 24c0-11.046-8.954-20-20-20" stroke={TEAL_BTN} strokeWidth="4" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
