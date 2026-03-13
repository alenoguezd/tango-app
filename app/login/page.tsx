"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";

const FONT = "var(--font-sans)";
const W = "#FFFFFF";
const BG_PAGE = "#FFFFFF";
const TEXT_PRI = "#111111";
const TEXT_SEC = "#555555";
const TEXT_MUT = "#9A9A9A";
const LINK_BLUE = "#1565C0";
const BUTTON_NAVY = "#1A6B8A";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
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

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message || "Error al registrarse");
        setLoading(false);
        return;
      }

      setError("");
      setVerificationEmail(email);
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
    setIsSignUp(false);
  };

  // Show verification screen if email was just verified
  if (verificationEmail) {
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
            borderRadius: "16px",
            padding: "40px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <Mail
              size={48}
              style={{
                color: BUTTON_NAVY,
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
              padding: "12px 16px",
              background: BUTTON_NAVY,
              color: W,
              border: "none",
              borderRadius: "8px",
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
              padding: "12px 16px",
              background: "transparent",
              color: LINK_BLUE,
              border: `1px solid ${LINK_BLUE}`,
              borderRadius: "8px",
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
          borderRadius: "16px",
          padding: "40px 24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
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
          {isSignUp ? "Regístrate" : "Iniciar sesión"}
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

        <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
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
          <div style={{ marginBottom: isSignUp ? "20px" : "24px" }}>
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
                  borderRadius: "8px",
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

          {/* Confirm password field (sign up only) */}
          {isSignUp && (
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
                    borderRadius: "8px",
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
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: BUTTON_NAVY,
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
            {loading ? "Procesando..." : isSignUp ? "Regístrate" : "Iniciar sesión"}
          </button>
        </form>

        {/* Toggle link */}
        <p
          style={{
            fontFamily: FONT,
            fontSize: "14px",
            color: TEXT_SEC,
            margin: "20px 0 0",
            textAlign: "center",
          }}
        >
          {isSignUp ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            style={{
              background: "none",
              border: "none",
              color: LINK_BLUE,
              cursor: "pointer",
              fontFamily: FONT,
              fontSize: "14px",
              fontWeight: 600,
              padding: "0",
            }}
          >
            {isSignUp ? "Inicia sesión" : "Regístrate"}
          </button>
        </p>
      </div>
    </div>
  );
}
