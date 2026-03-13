"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase";

const FONT = "var(--font-sans)";
const TEXT_PRI = "#111111";
const TEXT_SEC = "#555555";
const TEXT_MUT = "#9A9A9A";
const TEXT_RED = "#D0312D";
const BUTTON_NAVY = "#1A6B8A";
const DIVIDER = "#E8E8E8";

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

export default function PerfilPage() {
  const router = useRouter();
  const supabase = createClient();
  const windowWidth = useWindowSize();
  const isMobile = windowWidth < 1024;

  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [setsCount, setSetsCount] = useState(0);
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
      if (user.created_at) {
        const date = new Date(user.created_at);
        setCreatedAt(
          date.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
        );
      }

      // Load sets count
      const { data: sets } = await supabase
        .from("sets")
        .select("id", { count: "exact" })
        .eq("user_id", user.id);

      setSetsCount(sets?.length || 0);
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
      // First verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordError("Contraseña actual incorrecta");
        setPasswordLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setPasswordError(updateError.message || "Error al cambiar contraseña");
        setPasswordLoading(false);
        return;
      }

      setPasswordError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
      alert("¡Contraseña cambiada exitosamente!");
    } catch (err) {
      console.error("[Perfil] Password change error:", err);
      setPasswordError("Error al cambiar contraseña");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
      try {
        await supabase.auth.signOut();
        localStorage.clear();
        window.location.href = "/";
      } catch (err) {
        console.error("[Perfil] Logout error:", err);
        setError("Error al cerrar sesión");
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (
      confirm(
        "¿Eliminar tu cuenta? Esta acción no se puede deshacer y perderás todos tus sets."
      )
    ) {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Delete all user's sets first
        await supabase
          .from("sets")
          .delete()
          .eq("user_id", user.id);

        // Delete account
        const { error } = await supabase.auth.admin.deleteUser(user.id);

        if (error) {
          setError("Error al eliminar cuenta");
          return;
        }

        await supabase.auth.signOut();
        window.location.href = "/";
      } catch (err) {
        console.error("[Perfil] Delete account error:", err);
        setError("Error al eliminar cuenta");
      }
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100dvh",
          background: "#FFFFFF",
        }}
      >
        <p>Cargando...</p>
      </div>
    );
  }

  const userInitial = email.charAt(0).toUpperCase();
  const setsCreatedThisMonth = setsCount;
  const maxSetsMonth = 3;
  const renewalDate = new Date();
  renewalDate.setDate(renewalDate.getDate() + (30 - renewalDate.getDate()));

  // ===== MOBILE LAYOUT =====
  if (isMobile) {
    return (
      <div
        style={{
          height: "100dvh",
          maxWidth: "375px",
          margin: "0 auto",
          background: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Safe-area top spacer */}
        <div aria-hidden style={{ flexShrink: 0, height: "max(16px, env(safe-area-inset-top, 0px))" }} />

        {/* Scrollable body */}
        <div className="scroll-area" style={{ flex: 1, minHeight: 0, paddingBottom: "80px" }}>
          <div style={{ padding: "0 16px" }}>
            {/* Title */}
            <h1
              style={{
                fontFamily: FONT,
                fontSize: "36px",
                fontWeight: 500,
                color: "#1D1B20",
                lineHeight: "44px",
                margin: "8px 0 24px",
              }}
            >
              Perfil
            </h1>

            {error && (
              <div
                style={{
                  background: "#FFE5E5",
                  border: "1px solid #FF6B6B",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  fontFamily: FONT,
                  fontSize: "14px",
                  color: TEXT_RED,
                }}
              >
                {error}
              </div>
            )}

            {/* User card */}
            <div
              style={{
                background: "#F7F6F3",
                borderRadius: "16px",
                padding: "24px 16px",
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: BUTTON_NAVY,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "32px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                {userInitial}
              </div>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: "16px",
                  fontWeight: 500,
                  color: TEXT_PRI,
                  margin: "0 0 8px",
                }}
              >
                {email}
              </p>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: "13px",
                  color: TEXT_MUT,
                  margin: 0,
                }}
              >
                Miembro desde {createdAt}
              </p>
            </div>

            {/* Usage section */}
            <h2
              style={{
                fontFamily: FONT,
                fontSize: "15px",
                fontWeight: 600,
                color: TEXT_PRI,
                margin: "0 0 12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Uso este mes
            </h2>
            <div
              style={{
                background: "#F7F6F3",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: "14px",
                  color: TEXT_PRI,
                  margin: "0 0 12px",
                  fontWeight: 500,
                }}
              >
                {setsCreatedThisMonth} de {maxSetsMonth} sets creados
              </p>
              <div
                style={{
                  height: "6px",
                  background: "#E0E0E0",
                  borderRadius: "3px",
                  marginBottom: "12px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: BUTTON_NAVY,
                    width: `${(setsCreatedThisMonth / maxSetsMonth) * 100}%`,
                  }}
                />
              </div>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: "12px",
                  color: TEXT_MUT,
                  margin: 0,
                }}
              >
                Tu ciclo se renueva el {renewalDate.toLocaleDateString("es-ES")}
              </p>
            </div>

            {/* Account section */}
            <h2
              style={{
                fontFamily: FONT,
                fontSize: "15px",
                fontWeight: 600,
                color: TEXT_PRI,
                margin: "0 0 12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Cuenta
            </h2>

            {/* Email */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                background: "#F7F6F3",
                borderRadius: "12px",
                marginBottom: "12px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontFamily: FONT, fontSize: "12px", color: TEXT_MUT }}>
                  Correo electrónico
                </span>
                <span style={{ fontFamily: FONT, fontSize: "14px", color: TEXT_PRI, fontWeight: 500 }}>
                  {email}
                </span>
              </div>
            </div>

            {/* Change password */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                background: "#F7F6F3",
                borderRadius: "12px",
                marginBottom: "12px",
                cursor: "pointer",
              }}
              onClick={() => setShowChangePassword(!showChangePassword)}
            >
              <span style={{ fontFamily: FONT, fontSize: "14px", color: TEXT_PRI }}>
                Cambiar contraseña
              </span>
              <ArrowRight size={18} color={TEXT_MUT} />
            </div>

            {/* Change password form */}
            {showChangePassword && (
              <div
                style={{
                  background: "#F7F6F3",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "12px",
                }}
              >
                <form onSubmit={handleChangePassword}>
                  {/* Current password */}
                  <div style={{ marginBottom: "12px" }}>
                    <label
                      style={{
                        display: "block",
                        fontFamily: FONT,
                        fontSize: "12px",
                        fontWeight: 500,
                        color: TEXT_PRI,
                        marginBottom: "6px",
                      }}
                    >
                      Contraseña actual
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          padding: "10px 12px 10px 12px",
                          paddingRight: "36px",
                          fontFamily: FONT,
                          fontSize: "13px",
                          border: `1px solid #E0E0E0`,
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
                          color: TEXT_MUT,
                        }}
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* New password */}
                  <div style={{ marginBottom: "12px" }}>
                    <label
                      style={{
                        display: "block",
                        fontFamily: FONT,
                        fontSize: "12px",
                        fontWeight: 500,
                        color: TEXT_PRI,
                        marginBottom: "6px",
                      }}
                    >
                      Nueva contraseña
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          padding: "10px 12px 10px 12px",
                          paddingRight: "36px",
                          fontFamily: FONT,
                          fontSize: "13px",
                          border: `1px solid #E0E0E0`,
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
                          color: TEXT_MUT,
                        }}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div style={{ marginBottom: "12px" }}>
                    <label
                      style={{
                        display: "block",
                        fontFamily: FONT,
                        fontSize: "12px",
                        fontWeight: 500,
                        color: TEXT_PRI,
                        marginBottom: "6px",
                      }}
                    >
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontFamily: FONT,
                        fontSize: "13px",
                        border: `1px solid #E0E0E0`,
                        borderRadius: "8px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {passwordError && (
                    <div
                      style={{
                        background: "#FFE5E5",
                        border: "1px solid #FF6B6B",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        marginBottom: "12px",
                        fontFamily: FONT,
                        fontSize: "12px",
                        color: TEXT_RED,
                      }}
                    >
                      {passwordError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      background: BUTTON_NAVY,
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "8px",
                      fontFamily: FONT,
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: passwordLoading ? "not-allowed" : "pointer",
                      opacity: passwordLoading ? 0.7 : 1,
                    }}
                  >
                    {passwordLoading ? "Procesando..." : "Cambiar contraseña"}
                  </button>
                </form>
              </div>
            )}

            {/* Logout */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                background: "#F7F6F3",
                borderRadius: "12px",
                marginBottom: "24px",
                cursor: "pointer",
              }}
              onClick={handleLogout}
            >
              <span style={{ fontFamily: FONT, fontSize: "14px", color: TEXT_MUT }}>
                Cerrar sesión
              </span>
              <ArrowRight size={18} color={TEXT_MUT} />
            </div>

            {/* Delete account */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                background: "#FFF5F5",
                borderRadius: "12px",
                marginBottom: "32px",
                cursor: "pointer",
              }}
              onClick={handleDeleteAccount}
            >
              <span style={{ fontFamily: FONT, fontSize: "14px", color: TEXT_RED }}>
                Eliminar cuenta
              </span>
              <ArrowRight size={18} color={TEXT_RED} />
            </div>
          </div>
        </div>

        {/* Bottom navigation */}
        <nav
          style={{
            flexShrink: 0,
            width: "100%",
            background: "#FFFFFF",
            borderTop: `1px solid ${DIVIDER}`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-around",
            paddingTop: "10px",
            paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px) + 8px)",
          }}
        >
          <NavItem label="Inicio" active={false} icon={<SmileIcon />} onClick={() => handleNavigate("inicio")} />
          <NavItem label="Crear" active={false} icon={<FolderOpenIcon />} onClick={() => handleNavigate("crear")} />
          <NavItem label="Progreso" active={false} icon={<PlayIcon />} onClick={() => handleNavigate("progreso")} />
          <NavItem label="Perfil" active icon={<PersonIcon />} onClick={() => {}} />
        </nav>

        {/* iOS home indicator */}
        <div
          aria-hidden
          style={{
            flexShrink: 0,
            background: "#FFFFFF",
            display: "flex",
            justifyContent: "center",
            paddingTop: "4px",
            paddingBottom: "max(6px, env(safe-area-inset-bottom, 6px))",
          }}
        >
          <div style={{ width: "134px", height: "5px", borderRadius: "99px", background: "#111" }} />
        </div>
      </div>
    );
  }

  // ===== DESKTOP LAYOUT =====
  return (
    <div
      style={{
        height: "100dvh",
        background: "#F7F6F3",
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      <AppSidebar activeTab="perfil" onNavigate={handleNavigate} />

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "#F7F6F3",
        }}
      >
        {/* Safe-area top spacer */}
        <div aria-hidden style={{ flexShrink: 0, height: "max(16px, env(safe-area-inset-top, 0px))" }} />

        {/* Scrollable content */}
        <div className="scroll-area" style={{ flex: 1, minHeight: 0 }}>
          <div
            style={{
              maxWidth: "680px",
              margin: "0 auto",
              padding: "0 16px",
              width: "100%",
            }}
          >
            {/* Title */}
            <h1
              style={{
                fontFamily: FONT,
                fontSize: "36px",
                fontWeight: 500,
                color: "#1D1B20",
                lineHeight: "44px",
                margin: "8px 0 24px",
              }}
            >
              Perfil
            </h1>

            {error && (
              <div
                style={{
                  background: "#FFE5E5",
                  border: "1px solid #FF6B6B",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  fontFamily: FONT,
                  fontSize: "14px",
                  color: TEXT_RED,
                }}
              >
                {error}
              </div>
            )}

            {/* User card */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                padding: "24px",
                textAlign: "center",
                marginBottom: "24px",
                border: `1px solid ${DIVIDER}`,
              }}
            >
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background: BUTTON_NAVY,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "40px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                {userInitial}
              </div>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: "18px",
                  fontWeight: 500,
                  color: TEXT_PRI,
                  margin: "0 0 8px",
                }}
              >
                {email}
              </p>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: "14px",
                  color: TEXT_MUT,
                  margin: 0,
                }}
              >
                Miembro desde {createdAt}
              </p>
            </div>

            {/* Usage section */}
            <h2
              style={{
                fontFamily: FONT,
                fontSize: "15px",
                fontWeight: 600,
                color: TEXT_PRI,
                margin: "0 0 16px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Uso este mes
            </h2>
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px",
                border: `1px solid ${DIVIDER}`,
              }}
            >
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: "15px",
                  color: TEXT_PRI,
                  margin: "0 0 12px",
                  fontWeight: 500,
                }}
              >
                {setsCreatedThisMonth} de {maxSetsMonth} sets creados
              </p>
              <div
                style={{
                  height: "8px",
                  background: "#E0E0E0",
                  borderRadius: "4px",
                  marginBottom: "12px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: BUTTON_NAVY,
                    width: `${(setsCreatedThisMonth / maxSetsMonth) * 100}%`,
                  }}
                />
              </div>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: "13px",
                  color: TEXT_MUT,
                  margin: 0,
                }}
              >
                Tu ciclo se renueva el {renewalDate.toLocaleDateString("es-ES")}
              </p>
            </div>

            {/* Account section */}
            <h2
              style={{
                fontFamily: FONT,
                fontSize: "15px",
                fontWeight: 600,
                color: TEXT_PRI,
                margin: "0 0 16px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Cuenta
            </h2>

            <div style={{ background: "#FFFFFF", borderRadius: "12px", border: `1px solid ${DIVIDER}`, marginBottom: "24px", overflow: "hidden" }}>
              {/* Email */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom: `1px solid ${DIVIDER}`,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontFamily: FONT, fontSize: "12px", color: TEXT_MUT }}>
                    Correo electrónico
                  </span>
                  <span style={{ fontFamily: FONT, fontSize: "15px", color: TEXT_PRI, fontWeight: 500 }}>
                    {email}
                  </span>
                </div>
              </div>

              {/* Change password */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom: `1px solid ${DIVIDER}`,
                  cursor: "pointer",
                }}
                onClick={() => setShowChangePassword(!showChangePassword)}
              >
                <span style={{ fontFamily: FONT, fontSize: "15px", color: TEXT_PRI }}>
                  Cambiar contraseña
                </span>
                <ArrowRight size={18} color={TEXT_MUT} />
              </div>

              {/* Change password form */}
              {showChangePassword && (
                <div style={{ padding: "20px", borderBottom: `1px solid ${DIVIDER}`, background: "#F9F9F9" }}>
                  <form onSubmit={handleChangePassword}>
                    {/* Current password */}
                    <div style={{ marginBottom: "16px" }}>
                      <label
                        style={{
                          display: "block",
                          fontFamily: FONT,
                          fontSize: "13px",
                          fontWeight: 500,
                          color: TEXT_PRI,
                          marginBottom: "8px",
                        }}
                      >
                        Contraseña actual
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          style={{
                            width: "100%",
                            padding: "10px 12px 10px 12px",
                            paddingRight: "36px",
                            fontFamily: FONT,
                            fontSize: "14px",
                            border: `1px solid #E0E0E0`,
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
                            color: TEXT_MUT,
                          }}
                        >
                          {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div style={{ marginBottom: "16px" }}>
                      <label
                        style={{
                          display: "block",
                          fontFamily: FONT,
                          fontSize: "13px",
                          fontWeight: 500,
                          color: TEXT_PRI,
                          marginBottom: "8px",
                        }}
                      >
                        Nueva contraseña
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          style={{
                            width: "100%",
                            padding: "10px 12px 10px 12px",
                            paddingRight: "36px",
                            fontFamily: FONT,
                            fontSize: "14px",
                            border: `1px solid #E0E0E0`,
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
                            color: TEXT_MUT,
                          }}
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div style={{ marginBottom: "16px" }}>
                      <label
                        style={{
                          display: "block",
                          fontFamily: FONT,
                          fontSize: "13px",
                          fontWeight: 500,
                          color: TEXT_PRI,
                          marginBottom: "8px",
                        }}
                      >
                        Confirmar contraseña
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontFamily: FONT,
                          fontSize: "14px",
                          border: `1px solid #E0E0E0`,
                          borderRadius: "8px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {passwordError && (
                      <div
                        style={{
                          background: "#FFE5E5",
                          border: "1px solid #FF6B6B",
                          borderRadius: "6px",
                          padding: "10px 12px",
                          marginBottom: "16px",
                          fontFamily: FONT,
                          fontSize: "13px",
                          color: TEXT_RED,
                        }}
                      >
                        {passwordError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        background: BUTTON_NAVY,
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "8px",
                        fontFamily: FONT,
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: passwordLoading ? "not-allowed" : "pointer",
                        opacity: passwordLoading ? 0.7 : 1,
                      }}
                    >
                      {passwordLoading ? "Procesando..." : "Cambiar contraseña"}
                    </button>
                  </form>
                </div>
              )}

              {/* Logout */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  cursor: "pointer",
                }}
                onClick={handleLogout}
              >
                <span style={{ fontFamily: FONT, fontSize: "15px", color: TEXT_MUT }}>
                  Cerrar sesión
                </span>
                <ArrowRight size={18} color={TEXT_MUT} />
              </div>
            </div>

            {/* Delete account */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                background: "#FFFFFF",
                border: `1px solid #FFD4D4`,
                borderRadius: "12px",
                marginBottom: "32px",
                cursor: "pointer",
              }}
              onClick={handleDeleteAccount}
            >
              <span style={{ fontFamily: FONT, fontSize: "15px", color: TEXT_RED }}>
                Eliminar cuenta
              </span>
              <ArrowRight size={18} color={TEXT_RED} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        fontFamily: FONT,
        fontSize: "11px",
        fontWeight: active ? 700 : 400,
        color: active ? TEXT_PRI : TEXT_MUT,
      }}
    >
      <div
        style={{
          width: active ? "64px" : "44px",
          height: "32px",
          borderRadius: "16px",
          background: active ? "#EBEBEB" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "inherit",
          fontSize: "18px",
          transition: "width 0.15s ease, background 0.15s ease",
        }}
      >
        {icon}
      </div>
      <span>{label}</span>
    </button>
  );
}

function SmileIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="6"
        stroke="currentColor" strokeWidth="1.9" />
      <circle cx="8.5" cy="10" r="1.25" fill="currentColor" />
      <circle cx="15.5" cy="10" r="1.25" fill="currentColor" />
      <path d="M8.5 14c1.2 1.6 5.8 1.6 7 0"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FolderOpenIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 6h7.5L13 3h8a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <polygon points="5 3 19 12 5 21 5 3"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
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
