"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, ChevronRight } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { createClient } from "@/lib/supabase";
import { tokens } from "@/lib/design-tokens";
import { PageTitle } from "@/components/ui/page-title";

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
  const [fullName, setFullName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [setsCount, setSetsCount] = useState(0);
  const [cardsCount, setCardsCount] = useState(0);
  const [masteryPercent, setMasteryPercent] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [romajiEnabled, setRomajiEnabled] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setRomajiEnabled(localStorage.getItem("romaji_enabled") === "true");
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/");
        return;
      }

      setEmail(user.email || "");

      // Get name from metadata, fallback to email
      const metadataName = (user.user_metadata?.full_name as string) || "";
      const fallbackName = user.email?.split("@")[0] || "";
      const displayName = metadataName || fallbackName;

      setFullName(metadataName);
      setEditName(metadataName);
      setUserName(displayName.charAt(0).toUpperCase() + displayName.slice(1));

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

      // Calculate streak
      const studyLog = localStorage.getItem("study_log");
      if (studyLog) {
        try {
          const log: { date: string; cardsStudied: number }[] = JSON.parse(studyLog);
          if (log.length > 0) {
            log.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            let streakCount = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < log.length; i++) {
              const logDate = new Date(log[i].date);
              logDate.setHours(0, 0, 0, 0);
              const expectedDate = new Date(today);
              expectedDate.setDate(expectedDate.getDate() - i);

              if (logDate.getTime() === expectedDate.getTime()) {
                streakCount++;
              } else {
                break;
              }
            }
            setStreak(streakCount);
          }
        } catch {
          setStreak(0);
        }
      }
    } catch (err) {
      setError("Error al cargar datos del perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: editName,
        },
      });

      if (error) {
        setError("Error al guardar el nombre");
        return;
      }

      setFullName(editName);
      setUserName(editName.charAt(0).toUpperCase() + editName.slice(1));
      setIsEditingName(false);
      setError(null);
    } catch (err) {
      setError("Error al guardar el nombre");
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

  const ContentArea = () => (
    <>
      {/* Title */}
      <PageTitle>Perfil</PageTitle>

      {error && (
        <div style={{
          background: "#FFE5E5",
          border: `1px solid ${TEXT_RED}`,
          borderRadius: "8px",
          padding: `${tokens.spacing["3"]} ${tokens.spacing["4"]}`,
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
        padding: `${tokens.spacing["6"]} ${tokens.spacing["5"]}`,
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
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: tokens.spacing["2"],
          marginBottom: "4px",
        }}>
          {isEditingName ? (
            <div style={{
              display: "flex",
              gap: tokens.spacing["2"],
              alignItems: "center",
              flex: 1,
            }}>
              <input
                autoFocus
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  flex: 1,
                  padding: `${tokens.spacing["2"]} ${tokens.spacing["3"]}`,
                  fontFamily: FONT,
                  fontSize: "16px",
                  fontWeight: 700,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={handleSaveName}
                style={{
                  padding: `${tokens.spacing["2"]} ${tokens.spacing["4"]}`,
                  background: SAGE,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontFamily: FONT,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setIsEditingName(false);
                  setEditName(fullName);
                }}
                style={{
                  padding: `${tokens.spacing["2"]} ${tokens.spacing["4"]}`,
                  background: "transparent",
                  color: TEXT_SEC,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                  fontFamily: FONT,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <h2 style={{
                fontFamily: FONT,
                fontSize: "20px",
                fontWeight: 700,
                color: TEXT_PRI,
                margin: 0,
              }}>
                {userName}
              </h2>
              <button
                onClick={() => setIsEditingName(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: tokens.spacing["1"],
                  display: "flex",
                  alignItems: "center",
                  fontSize: "16px",
                }}
              >
                ✏️
              </button>
            </>
          )}
        </div>
        <p style={{
          fontFamily: FONT,
          fontSize: "13px",
          color: TEXT_SEC,
          margin: `0 0 ${tokens.spacing["3"]}`,
        }}>
          {email}
        </p>

        {/* Streak badge */}
        {streak > 0 && (
          <div style={{
            background: BUTTER,
            borderRadius: "50px",
            padding: `${tokens.spacing["2"]} ${tokens.spacing["3"]}`,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: FONT,
            fontSize: "12px",
            fontWeight: 700,
            color: TEXT_PRI,
          }}>
            <span>💧</span>
            <span>{streak} días seguidos</span>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: tokens.spacing["3"],
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
        padding: tokens.spacing["5"],
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
              margin: `0 0 ${tokens.spacing["1"]}`,
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
          {setsCreatedThisMonth >= maxSetsMonth && (
            <div style={{
              background: "#FFE5F0",
              borderRadius: "50px",
              padding: `${tokens.spacing["1"]} ${tokens.spacing["3"]}`,
              fontFamily: FONT,
              fontSize: "11px",
              fontWeight: 700,
              color: TEXT_RED,
              whiteSpace: "nowrap",
            }}>
              Límite superado
            </div>
          )}
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
          padding: `${tokens.spacing["3"]} ${tokens.spacing["4"]}`,
          fontFamily: FONT,
          fontSize: "14px",
          fontWeight: 700,
          cursor: "pointer",
        }}>
          Mejorar plan →
        </button>
      </div>

      {/* Preferences section */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{
          fontFamily: FONT,
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.07em",
          color: TEXT_SEC,
          margin: `0 0 ${tokens.spacing["3"]}`,
          textTransform: "uppercase",
        }}>
          Preferencias
        </h3>

        <div style={{
          background: W,
          border: `1px solid ${BORDER}`,
          borderRadius: "14px",
          padding: tokens.spacing["4"],
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}>
          <div>
            <p style={{
              fontFamily: FONT,
              fontSize: "14px",
              fontWeight: 700,
              color: TEXT_PRI,
              margin: 0,
            }}>
              Mostrar rōmaji
            </p>
            <p style={{
              fontFamily: FONT,
              fontSize: "12px",
              color: TEXT_SEC,
              margin: "2px 0 0",
            }}>
              Pronunciación en letras latinas bajo el kana
            </p>
          </div>
          <button
            role="switch"
            aria-checked={romajiEnabled}
            onClick={() => {
              const next = !romajiEnabled;
              setRomajiEnabled(next);
              localStorage.setItem("romaji_enabled", String(next));
            }}
            style={{
              width: "44px",
              height: "26px",
              borderRadius: "13px",
              background: romajiEnabled ? SAGE : BORDER,
              border: "none",
              cursor: "pointer",
              position: "relative",
              transition: "background 200ms ease",
              flexShrink: 0,
            }}
          >
            <div style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "white",
              position: "absolute",
              top: "3px",
              left: romajiEnabled ? "21px" : "3px",
              transition: "left 200ms ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
          </button>
        </div>
      </div>

      {/* Account section */}
      <div>
        <h3 style={{
          fontFamily: FONT,
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.07em",
          color: TEXT_SEC,
          margin: `0 0 ${tokens.spacing["3"]}`,
          textTransform: "uppercase",
        }}>
          Cuenta
        </h3>

        {/* Email item */}
        <div style={{
          background: W,
          border: `1px solid ${BORDER}`,
          borderRadius: "14px",
          padding: tokens.spacing["4"],
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
              margin: `0 0 ${tokens.spacing["1"]}`,
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
            padding: tokens.spacing["4"],
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
            padding: tokens.spacing["4"],
            marginBottom: "12px",
            display: "flex",
            flexDirection: "column",
            gap: tokens.spacing["3"],
          }}>
            {passwordError && (
              <div style={{
                background: "#FFE5E5",
                color: TEXT_RED,
                padding: `${tokens.spacing["2"]} ${tokens.spacing["3"]}`,
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
                    padding: `${tokens.spacing["2"]} ${tokens.spacing["3"]}`,
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
                    padding: `${tokens.spacing["2"]} ${tokens.spacing["3"]}`,
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
                  padding: `${tokens.spacing["2"]} ${tokens.spacing["3"]}`,
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
                  padding: tokens.spacing["2"],
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
                  padding: tokens.spacing["2"],
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
            padding: tokens.spacing["4"],
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
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          height: "0",
          paddingBottom: "100px",
        }}>
          <div style={{ padding: "0 16px" }}>
            <ContentArea />
          </div>
        </div>

        {/* Navigation */}
        <AppNav active="perfil" onNavigate={handleNavigate} />

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
      {/* Navigation (renders sidebar on desktop) */}
      <AppNav active="perfil" onNavigate={handleNavigate} />

      {/* Sidebar spacer for desktop layout */}
      <div style={{ display: "none" }} className="hidden lg:block lg:w-64 flex-shrink-0" />

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
            padding: `0 ${tokens.spacing["4"]}`,
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
  const TEXT_SEC = "#8A7F74";

  return (
    <div style={{
      background,
      borderRadius: "12px",
      padding: `${tokens.spacing["4"]} ${tokens.spacing["3"]}`,
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

