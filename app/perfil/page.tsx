"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, ChevronRight, FolderOpen, Play } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase";
import { tokens } from "@/lib/design-tokens";

// ── Design tokens ────────────────────────────────────────────────────────────
const FONT = "var(--font-sans)";
const W = tokens.color.surface;
const BG_PAGE = tokens.color.page;
const TEXT_PRI = tokens.color.ink;
const TEXT_SEC = tokens.color.muted;
const TEXT_RED = tokens.color.rose;
const SAGE = tokens.color.sage;
const ROSE = tokens.color.rose;
const BUTTER = tokens.color.butter;
const BORDER = tokens.color.border;

const SAGE_LIGHT = "#E0F2E0";
const BLUE_LIGHT = "#E0EDF8";
const BUTTER_LIGHT = "#FFF9E0";
const NAV_PILL = "#F0F0F0";

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

export default function PerfilPage() {
  const router = useRouter();
  const supabase = createClient();
  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 1024;

  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [setsCount, setSetsCount] = useState(0);
  const [cardsCount, setCardsCount] = useState(0);
  const [masteryPercent, setMasteryPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setEmail(user.email || "");
      const name = user.email?.split("@")[0] || "";
      setUserName(name.charAt(0).toUpperCase() + name.slice(1));

      if (user.created_at) {
        const date = new Date(user.created_at);
        setCreatedAt(
          date.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
        );
      }

      // Load sets and cards
      const { data: sets } = await supabase
        .from("sets")
        .select("id, cards", { count: "exact" })
        .eq("user_id", user.id);

      setSetsCount(sets?.length || 0);

      // Count total cards
      let totalCards = 0;
      let knownCards = 0;
      if (sets) {
        sets.forEach((set: any) => {
          if (set.cards && Array.isArray(set.cards)) {
            totalCards += set.cards.length;
            knownCards += set.cards.filter((c: any) => c.known === true).length;
          }
        });
      }

      setCardsCount(totalCards);
      const pct = totalCards > 0 ? Math.round((knownCards / totalCards) * 100) : 0;
      setMasteryPercent(pct);
    } catch (err) {
      console.error("[Perfil] Error loading user data:", err);
      setError("Error al cargar datos del perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(error.message);
      } else {
        setShowChangePassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        alert("Contraseña actualizada correctamente");
      }
    } catch (err) {
      setPasswordError("Error al cambiar la contraseña");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error("[Perfil] Logout error:", err);
      setError("Error al cerrar sesión");
    }
  };

  const handleNavigate = (tab: "inicio" | "crear" | "progreso" | "perfil") => {
    if (tab === "progreso") {
      router.push("/progreso");
    } else if (tab === "crear") {
      router.push("/crear");
    } else if (tab === "perfil") {
      // Already on perfil
    } else {
      router.push("/inicio");
    }
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        background: BG_PAGE,
      }}>
        <p>Cargando...</p>
      </div>
    );
  }

  const userInitial = email.charAt(0).toUpperCase();
  const setsCreatedThisMonth = setsCount;
  const maxSetsMonth = 3;
  const streakDays = 5; // Mock data for now

  const ContentArea = () => (
    <>
      {/* Status bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
      }}>
        <span style={{
          fontFamily: FONT,
          fontSize: "14px",
          fontWeight: 500,
          color: TEXT_PRI,
        }}>
          9:41
        </span>
        <div style={{ display: "flex", gap: "4px" }}>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              style={{
                width: "3px",
                height: "3px",
                borderRadius: "50%",
                background: TEXT_SEC,
              }}
            />
          ))}
        </div>
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: FONT,
        fontSize: "48px",
        fontWeight: 800,
        letterSpacing: "-0.01em",
        color: TEXT_PRI,
        lineHeight: 1,
        margin: "0 0 24px",
      }}>
        Perfil
      </h1>

      {error && (
        <div style={{
          background: "#FFE5E5",
          border: `1px solid ${TEXT_RED}`,
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "20px",
          fontFamily: FONT,
          fontSize: "14px",
          color: TEXT_RED,
        }}>
          {error}
        </div>
      )}

      {/* User card */}
      <div style={{
        background: W,
        border: `1px solid ${BORDER}`,
        borderRadius: "16px",
        padding: "24px 20px",
        textAlign: "center",
        marginBottom: "24px",
      }}>
        {/* Avatar */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: "16px" }}>
          <div style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: ROSE,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
            fontWeight: 700,
            color: TEXT_PRI,
            margin: "0 auto",
          }}>
            {userInitial}
          </div>
          <button style={{
            position: "absolute",
            bottom: "0",
            right: "0",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#1A1A1A",
            border: "3px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "white",
          }}>
            ✏️
          </button>
        </div>

        {/* Name and email */}
        <h2 style={{
          fontFamily: FONT,
          fontSize: "20px",
          fontWeight: 700,
          color: TEXT_PRI,
          margin: "12px 0 4px",
        }}>
          {userName}
        </h2>
        <p style={{
          fontFamily: FONT,
          fontSize: "13px",
          color: TEXT_SEC,
          margin: "0 0 12px",
        }}>
          {email}
        </p>

        {/* Streak badge */}
        <div style={{
          background: BUTTER,
          borderRadius: "50px",
          padding: "8px 14px",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontFamily: FONT,
          fontSize: "12px",
          fontWeight: 700,
          color: TEXT_PRI,
        }}>
          <span>💧</span>
          <span>{streakDays} días seguidos</span>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "12px",
        marginBottom: "24px",
      }}>
        <StatCard label="sets creados" value={String(setsCount)} background={SAGE_LIGHT} />
        <StatCard label="tarjetas" value={String(cardsCount)} background={BLUE_LIGHT} />
        <StatCard label="dominio" value={`${masteryPercent}%`} background={BUTTER_LIGHT} />
      </div>

      {/* Plan section */}
      <div style={{
        background: W,
        border: `1px solid ${BORDER}`,
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "24px",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px",
        }}>
          <div>
            <h3 style={{
              fontFamily: FONT,
              fontSize: "16px",
              fontWeight: 700,
              color: TEXT_PRI,
              margin: "0 0 4px",
            }}>
              Plan gratuito
            </h3>
            <p style={{
              fontFamily: FONT,
              fontSize: "12px",
              color: TEXT_SEC,
              margin: "0 0 8px",
            }}>
              {setsCreatedThisMonth} / {maxSetsMonth} sets · ciclo renueva
            </p>
            <p style={{
              fontFamily: FONT,
              fontSize: "12px",
              color: TEXT_SEC,
              margin: 0,
            }}>
              30/3
            </p>
          </div>
          <div style={{
            background: "#FFE5F0",
            borderRadius: "50px",
            padding: "6px 12px",
            fontFamily: FONT,
            fontSize: "11px",
            fontWeight: 700,
            color: TEXT_RED,
            whiteSpace: "nowrap",
          }}>
            Límite superado
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          width: "100%",
          height: "6px",
          background: "#E8E8E8",
          borderRadius: "3px",
          marginBottom: "16px",
          overflow: "hidden",
        }}>
          <div style={{
            width: `${(setsCreatedThisMonth / maxSetsMonth) * 100}%`,
            height: "100%",
            background: ROSE,
            borderRadius: "3px",
          }} />
        </div>

        {/* Upgrade button */}
        <button style={{
          width: "100%",
          background: TEXT_PRI,
          color: "white",
          border: "none",
          borderRadius: "50px",
          padding: "14px 16px",
          fontFamily: FONT,
          fontSize: "14px",
          fontWeight: 700,
          cursor: "pointer",
        }}>
          Mejorar plan →
        </button>
      </div>

      {/* Account section */}
      <div>
        <h3 style={{
          fontFamily: FONT,
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.07em",
          color: TEXT_SEC,
          margin: "0 0 12px",
          textTransform: "uppercase",
        }}>
          Cuenta
        </h3>

        {/* Email item */}
        <div style={{
          background: W,
          border: `1px solid ${BORDER}`,
          borderRadius: "14px",
          padding: "16px",
          marginBottom: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <p style={{
              fontFamily: FONT,
              fontSize: "11px",
              color: TEXT_SEC,
              margin: "0 0 4px",
              fontWeight: 600,
            }}>
              Correo
            </p>
            <p style={{
              fontFamily: FONT,
              fontSize: "14px",
              fontWeight: 700,
              color: TEXT_PRI,
              margin: 0,
            }}>
              {email}
            </p>
          </div>
        </div>

        {/* Change password item */}
        <button
          onClick={() => setShowChangePassword(!showChangePassword)}
          style={{
            width: "100%",
            background: W,
            border: `1px solid ${BORDER}`,
            borderRadius: "14px",
            padding: "16px",
            marginBottom: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            fontFamily: FONT,
          }}
        >
          <span style={{
            fontSize: "14px",
            fontWeight: 700,
            color: TEXT_PRI,
          }}>
            Cambiar contraseña
          </span>
          <ChevronRight size={20} color={TEXT_SEC} />
        </button>

        {/* Change password form */}
        {showChangePassword && (
          <form onSubmit={handleChangePassword} style={{
            background: "#F5F5F5",
            borderRadius: "14px",
            padding: "16px",
            marginBottom: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            {passwordError && (
              <div style={{
                background: "#FFE5E5",
                color: TEXT_RED,
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "12px",
              }}>
                {passwordError}
              </div>
            )}

            <div>
              <label style={{
                fontFamily: FONT,
                fontSize: "12px",
                fontWeight: 600,
                color: TEXT_SEC,
                display: "block",
                marginBottom: "4px",
              }}>
                Contraseña actual
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontFamily: FONT,
                    fontSize: "13px",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: TEXT_SEC,
                  }}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{
                fontFamily: FONT,
                fontSize: "12px",
                fontWeight: 600,
                color: TEXT_SEC,
                display: "block",
                marginBottom: "4px",
              }}>
                Nueva contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontFamily: FONT,
                    fontSize: "13px",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: TEXT_SEC,
                  }}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{
                fontFamily: FONT,
                fontSize: "12px",
                fontWeight: 600,
                color: TEXT_SEC,
                display: "block",
                marginBottom: "4px",
              }}>
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontFamily: FONT,
                  fontSize: "13px",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="submit"
                disabled={passwordLoading}
                style={{
                  flex: 1,
                  background: TEXT_PRI,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px",
                  fontFamily: FONT,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: passwordLoading ? "not-allowed" : "pointer",
                  opacity: passwordLoading ? 0.6 : 1,
                }}
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setShowChangePassword(false)}
                style={{
                  flex: 1,
                  background: "transparent",
                  color: TEXT_SEC,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                  padding: "10px",
                  fontFamily: FONT,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Logout item */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            background: W,
            border: `1px solid ${BORDER}`,
            borderRadius: "14px",
            padding: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            fontFamily: FONT,
          }}
        >
          <span style={{
            fontSize: "14px",
            fontWeight: 700,
            color: TEXT_RED,
          }}>
            Cerrar sesión
          </span>
          <ChevronRight size={20} color={TEXT_RED} />
        </button>
      </div>
    </>
  );

  // ===== MOBILE LAYOUT =====
  if (isMobile) {
    return (
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
          background: BG_PAGE,
        }} />

        {/* Scrollable content */}
        <div style={{
          flex: 1,
          overflowY: "scroll",
          WebkitOverflowScrolling: "touch",
          height: "0",
          paddingBottom: "100px",
        }}>
          <div style={{ padding: "0 16px" }}>
            <ContentArea />
          </div>
        </div>

        {/* Bottom navigation */}
        <nav style={{
          flexShrink: 0,
          width: "100%",
          background: W,
          borderTop: `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-around",
          paddingTop: "10px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px) + 8px)",
        }}>
          <NavItem
            label="Inicio"
            active={false}
            icon={<SmileIcon />}
            onClick={() => handleNavigate("inicio")}
          />
          <NavItem
            label="Crear"
            active={false}
            icon={<FolderOpen style={{ width: "22px", height: "22px", strokeWidth: 1.8 }} />}
            onClick={() => handleNavigate("crear")}
          />
          <NavItem
            label="Progreso"
            active={false}
            icon={<Play style={{ width: "20px", height: "20px", strokeWidth: 1.8 }} />}
            onClick={() => handleNavigate("progreso")}
          />
          <NavItem
            label="Perfil"
            active
            icon={<PersonIcon />}
            onClick={() => {}}
          />
        </nav>

        {/* iOS home indicator */}
        <div aria-hidden style={{
          flexShrink: 0,
          background: W,
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
  }

  // ===== DESKTOP LAYOUT =====
  return (
    <div style={{
      height: "100dvh",
      background: BG_PAGE,
      display: "flex",
      flexDirection: "row",
    }}>
      <AppSidebar activeTab="perfil" onNavigate={handleNavigate} />

      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: BG_PAGE,
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
          height: "100vh",
          paddingBottom: "40px",
        }}>
          <div style={{
            maxWidth: "680px",
            margin: "0 auto",
            padding: "0 16px",
            width: "100%",
          }}>
            <ContentArea />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── StatCard ────────────────────────────────────────────────────────────────
function StatCard({ label, value, background }: { label: string; value: string; background: string }) {
  const FONT = "var(--font-sans)";
  const TEXT_PRI = "#1A1A1A";
  const TEXT_SEC = "#B0A898";

  return (
    <div style={{
      background,
      borderRadius: "12px",
      padding: "16px 12px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <span style={{
        fontFamily: FONT,
        fontSize: "24px",
        fontWeight: 700,
        color: TEXT_PRI,
        lineHeight: 1,
        marginBottom: "4px",
      }}>
        {value}
      </span>
      <span style={{
        fontFamily: FONT,
        fontSize: "11px",
        fontWeight: 500,
        color: TEXT_SEC,
      }}>
        {label}
      </span>
    </div>
  );
}

// ── NavItem ────────────────────────────────────────────────────────────────
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
      <div
        style={{
          width: active ? "64px" : "44px",
          height: "32px",
          borderRadius: "12px",
          background: active ? NAV_PILL : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: active ? TEXT_PRI : TEXT_SEC,
          transition: "width 0.15s ease, background 0.15s ease",
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontFamily: FONT,
          fontSize: "11px",
          fontWeight: active ? 700 : 400,
          color: active ? TEXT_PRI : TEXT_SEC,
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ── SmileIcon ─────────────────────────────────────────────────────────────────
function SmileIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="8.5" cy="10" r="1.25" fill="currentColor" />
      <circle cx="15.5" cy="10" r="1.25" fill="currentColor" />
      <path
        d="M8.5 14c1.2 1.6 5.8 1.6 7 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 20c0-4.418 4.03-8 9-8s9 3.582 9 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
