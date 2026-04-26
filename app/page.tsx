"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import { tokens } from "@/lib/design-tokens";

const FONT = "var(--font-sans)";
const FONT_JP = "var(--font-japanese), var(--font-sans)";
const W = tokens.color.surface;
const BG_PAGE = tokens.color.page;
const TEXT_PRI = tokens.color.ink;
const TEXT_SEC = tokens.color.muted;
const TEXT_MUT = tokens.color.muted;
const LINK_ACCENT = tokens.color.sage;
const BUTTON_PRIMARY = tokens.color.ink;

type EntryScreen = "splash" | "login" | "signup" | "verification";

export default function Home() {
  const router = useRouter();
  const supabase = hasSupabaseConfig() ? createClient() : null;

  const [screen, setScreen] = useState<EntryScreen>("splash");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    checkAuthAndMount();
  }, []);

  const checkAuthAndMount = async () => {
    if (!supabase) {
      setMounted(true);
      return;
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        // Invalid or missing refresh token - clear session and show login
        await supabase.auth.signOut().catch(() => {});
        setMounted(true);
        return;
      }
      if (user) {
        router.push("/inicio");
        return;
      }
    } catch (error) {
    }
    setMounted(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!supabase) {
        setError("Supabase no está configurado en este entorno local.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      router.push("/inicio");
    } catch (err) {
      setError("Error al iniciar sesión");
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Por favor ingresa tu nombre");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      if (!supabase) {
        setError("Supabase no está configurado en este entorno local.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        setError(error.message || "Error al registrarse");
        setLoading(false);
        return;
      }

      setError("");
      setVerificationEmail(email);
      setScreen("verification");
      setLoading(false);
    } catch (err) {
      setError("Error al registrarse");
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setError("");
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: verificationEmail,
      });

      if (error) {
        setError(error.message || "Error al reenviar correo");
        return;
      }

      setError("Correo de verificación reenviado. Revisa tu bandeja de entrada.");
    } catch (err) {
      setError("Error al reenviar correo");
    }
  };

  const handleVerificationComplete = () => {
    setVerificationEmail("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setScreen("splash");
  };

  const handleBackToSplash = () => {
    setScreen("splash");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setError("");
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Por favor ingresa tu email");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        setError(error.message || "Error al enviar correo de recuperación");
        setLoading(false);
        return;
      }

      setError("Enviamos un link de recuperación a tu email. Revisa tu bandeja de entrada.");
      setLoading(false);
    } catch (err) {
      setError("Error al enviar correo de recuperación");
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  // ===== VERIFICATION SCREEN =====
  if (screen === "verification") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          background: BG_PAGE,
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            background: W,
            borderRadius: tokens.radius.card,
            padding: "40px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <Mail
              size={48}
              style={{
                color: BUTTON_PRIMARY,
                marginBottom: "16px",
                display: "block",
                margin: "0 auto 16px",
              }}
            />
            <h1
              style={{
                fontFamily: FONT,
                fontSize: "28px",
                fontWeight: 600,
                color: TEXT_PRI,
                margin: "0 0 12px",
              }}
            >
              Verifica tu correo
            </h1>
            <p
              style={{
                fontFamily: FONT,
                fontSize: "14px",
                color: TEXT_SEC,
                margin: "0",
              }}
            >
              Hemos enviado un correo de confirmación a{" "}
              <strong>{verificationEmail}</strong>. Por favor, abre el enlace para
              verificar tu cuenta.
            </p>
          </div>

          {error && (
            <div
              style={{
                background:
                  error.includes("reenviado") ? "#E8F5E9" : "#FFE5E5",
                border: error.includes("reenviado")
                  ? "1px solid #4CAF50"
                  : "1px solid #FF6B6B",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "20px",
                fontFamily: FONT,
                fontSize: "14px",
                color: error.includes("reenviado") ? "#2E7D32" : "#D0312D",
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleVerificationComplete}
            style={{
              width: "100%",
              height: "48px",
              padding: "0 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: BUTTON_PRIMARY,
              color: W,
              border: "none",
              borderRadius: tokens.radius.card,
              fontFamily: FONT,
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: "12px",
            }}
          >
            Ya verifiqué mi correo
          </button>

          <button
            onClick={handleResendVerification}
            style={{
              width: "100%",
              height: "48px",
              padding: "0 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              color: LINK_ACCENT,
              border: `1px solid ${LINK_ACCENT}`,
              borderRadius: tokens.radius.card,
              fontFamily: FONT,
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reenviar correo
          </button>
        </div>
      </div>
    );
  }

  // ===== LOGIN FORM =====
  if (screen === "login") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          background: BG_PAGE,
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            background: W,
            borderRadius: tokens.radius.card,
            padding: "40px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <button
            onClick={handleBackToSplash}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              color: TEXT_MUT,
            }}
          >
            <ArrowLeft size={20} />
          </button>

          <h1
            style={{
              fontFamily: FONT,
              fontSize: "28px",
              fontWeight: 600,
              color: TEXT_PRI,
              margin: "0 0 24px",
              textAlign: "center",
            }}
          >
            Iniciar sesión
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
                color: "#D0312D",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email field */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: FONT,
                  fontSize: "14px",
                  fontWeight: 500,
                  color: TEXT_PRI,
                  marginBottom: "8px",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontFamily: FONT,
                  fontSize: "14px",
                  border: `1px solid #E0E0E0`,
                  borderRadius: "8px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: FONT,
                  fontSize: "14px",
                  fontWeight: 500,
                  color: TEXT_PRI,
                  marginBottom: "8px",
                }}
              >
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 16px",
                    paddingRight: "44px",
                    fontFamily: FONT,
                    fontSize: "14px",
                    border: `1px solid #E0E0E0`,
                    borderRadius: tokens.radius.card,
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: TEXT_MUT,
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: BUTTON_PRIMARY,
                color: W,
                border: "none",
                borderRadius: "8px",
                fontFamily: FONT,
                fontSize: "15px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginBottom: "16px",
              }}
            >
              {loading ? "Procesando..." : "Iniciar sesión"}
            </button>

            {/* Forgot password link */}
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              style={{
                background: "none",
                border: "none",
                color: LINK_ACCENT,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: FONT,
                fontSize: "14px",
                fontWeight: 600,
                padding: "0",
                width: "100%",
                textAlign: "center",
                opacity: loading ? 0.7 : 1,
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ===== SIGNUP FORM =====
  if (screen === "signup") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          background: BG_PAGE,
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            background: W,
            borderRadius: tokens.radius.card,
            padding: "40px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <button
            onClick={handleBackToSplash}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              color: TEXT_MUT,
            }}
          >
            <ArrowLeft size={20} />
          </button>

          <h1
            style={{
              fontFamily: FONT,
              fontSize: "28px",
              fontWeight: 600,
              color: TEXT_PRI,
              margin: "0 0 24px",
              textAlign: "center",
            }}
          >
            Crear cuenta
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
                color: "#D0312D",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp}>
            {/* Name field */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: FONT,
                  fontSize: "14px",
                  fontWeight: 500,
                  color: TEXT_PRI,
                  marginBottom: "8px",
                }}
              >
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontFamily: FONT,
                  fontSize: "14px",
                  border: `1px solid #E0E0E0`,
                  borderRadius: "8px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Email field */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: FONT,
                  fontSize: "14px",
                  fontWeight: 500,
                  color: TEXT_PRI,
                  marginBottom: "8px",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontFamily: FONT,
                  fontSize: "14px",
                  border: `1px solid #E0E0E0`,
                  borderRadius: "8px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: FONT,
                  fontSize: "14px",
                  fontWeight: 500,
                  color: TEXT_PRI,
                  marginBottom: "8px",
                }}
              >
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 16px",
                    paddingRight: "44px",
                    fontFamily: FONT,
                    fontSize: "14px",
                    border: `1px solid #E0E0E0`,
                    borderRadius: tokens.radius.card,
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: TEXT_MUT,
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password field */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: FONT,
                  fontSize: "14px",
                  fontWeight: 500,
                  color: TEXT_PRI,
                  marginBottom: "8px",
                }}
              >
                Confirmar contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 16px",
                    paddingRight: "44px",
                    fontFamily: FONT,
                    fontSize: "14px",
                    border: `1px solid #E0E0E0`,
                    borderRadius: tokens.radius.card,
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: TEXT_MUT,
                  }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: BUTTON_PRIMARY,
                color: W,
                border: "none",
                borderRadius: "8px",
                fontFamily: FONT,
                fontSize: "15px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Procesando..." : "Crear cuenta"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ===== SPLASH/ENTRY SCREEN =====
  return (
    <>
      {/* Mobile Layout (< 768px) */}
      <div
        className="flex flex-col w-full select-none md:hidden"
        style={{ height: "100dvh", background: W, overflow: "hidden" }}
      >
        {/* Illustration — top ~45% */}
        <div className="relative w-full flex-shrink-0" style={{ height: "45dvh" }}>
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
            paddingTop: "clamp(24px, 4dvh, 40px)",
            paddingBottom: "max(28px, env(safe-area-inset-bottom, 16px) + 16px)",
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <h1
              style={{
                fontFamily: FONT_JP,
                fontSize: "clamp(2rem, 8vw, 2.5rem)",
                fontWeight: 700,
                color: TEXT_PRI,
                letterSpacing: "-0.02em",
                textAlign: "center",
                margin: 0,
              }}
            >
              単語
            </h1>
            <p
              style={{
                fontFamily: FONT,
                fontSize: "0.9375rem",
                fontWeight: 400,
                color: TEXT_SEC,
                lineHeight: 1.5,
                textAlign: "center",
                margin: 0,
              }}
            >
              Aprende japonés con tus propias palabras
            </p>
          </div>

          {/* Buttons */}
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => setScreen("login")}
              style={{
                height: "48px",
                borderRadius: tokens.radius.card,
                background: BUTTON_PRIMARY,
                color: W,
                fontSize: "1rem",
                fontFamily: FONT,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.01em",
              }}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setScreen("signup")}
              style={{
                height: "48px",
                borderRadius: tokens.radius.card,
                background: "transparent",
                color: BUTTON_PRIMARY,
                fontSize: "1rem",
                fontFamily: FONT,
                fontWeight: 600,
                border: `2px solid ${BUTTON_PRIMARY}`,
                cursor: "pointer",
                letterSpacing: "0.01em",
              }}
            >
              Crear cuenta
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout (≥ 768px) */}
      <div
        className="hidden md:flex w-full select-none"
        style={{ height: "100dvh", background: W, overflow: "hidden" }}
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
          style={{ background: W }}
        >
          <div
            className="flex flex-col items-center"
            style={{ maxWidth: "300px", gap: "28px" }}
          >
            {/* App name: large and bold */}
            <h1
              style={{
                fontFamily: FONT_JP,
                fontSize: "3.5rem",
                fontWeight: 700,
                color: TEXT_PRI,
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
                fontFamily: FONT,
                fontSize: "1.0625rem",
                fontWeight: 400,
                color: TEXT_SEC,
                lineHeight: 1.6,
                textAlign: "center",
                margin: 0,
              }}
            >
              Aprende japonés con tus propias palabras
            </p>

            {/* Buttons */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => setScreen("login")}
                style={{
                  height: "56px",
                  borderRadius: "14px",
                  background: BUTTON_PRIMARY,
                  color: W,
                  fontSize: "1rem",
                  fontFamily: FONT,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0F4F63";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = BUTTON_PRIMARY;
                }}
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => setScreen("signup")}
                style={{
                  height: "56px",
                  borderRadius: "14px",
                  background: "transparent",
                  color: BUTTON_PRIMARY,
                  fontSize: "1rem",
                  fontFamily: FONT,
                  fontWeight: 600,
                  border: `2px solid ${BUTTON_PRIMARY}`,
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F5F5F5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Crear cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
