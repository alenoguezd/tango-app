"use client";

import { useEffect, useState } from "react";
import { Home, Camera, BarChart3, User } from "lucide-react";
import { tokens } from "@/lib/design-tokens";

interface AppNavProps {
  active: "inicio" | "crear" | "progreso" | "perfil";
  onNavigate: (tab: "inicio" | "crear" | "progreso" | "perfil") => void;
}

const NAV_ITEMS = [
  { id: "inicio" as const, label: "Inicio", icon: Home },
  { id: "crear" as const, label: "Crear", icon: Camera },
  { id: "progreso" as const, label: "Progreso", icon: BarChart3 },
  { id: "perfil" as const, label: "Perfil", icon: User },
];

const NAV_LABELS = {
  inicio: "Ir a Inicio",
  crear: "Ir a Crear",
  progreso: "Ir a Progreso",
  perfil: "Ir a Perfil",
};

export function AppNav({ active, onNavigate }: AppNavProps) {
  const [isMobile, setIsMobile] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!mounted) return null;

  // Mobile: Bottom navigation
  if (isMobile) {
    return (
      <nav
        style={{
          width: "100%",
          background: tokens.color.surface,
          borderTop: `1px solid ${tokens.color.border}`,
          display: "flex",
          justifyContent: "space-around",
          paddingTop: tokens.spacing["3"],
          paddingBottom: `max(${tokens.spacing["5"]}, env(safe-area-inset-bottom, 6px))`,
        }}
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-label={NAV_LABELS[id]}
            aria-current={active === id ? "page" : undefined}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: tokens.spacing["1"],
              minHeight: "48px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0",
            }}
          >
            <Icon
              width={20}
              height={20}
              color={active === id ? tokens.color.ink : tokens.color.muted}
            />
            <span
              style={{
                fontFamily: tokens.typography.family.ui,
                fontSize: tokens.typography.size.xs,
                fontWeight: active === id ? tokens.typography.weight.bold : tokens.typography.weight.regular,
                lineHeight: tokens.typography.lineHeight.tight,
                color: active === id ? tokens.color.ink : tokens.color.muted,
              }}
            >
              {label}
            </span>
          </button>
        ))}
      </nav>
    );
  }

  // Desktop: Left sidebar navigation
  return (
    <aside
      style={{
        width: "256px",
        height: "100vh",
        background: tokens.color.page,
        borderRight: `1px solid ${tokens.color.border}`,
        display: "flex",
        flexDirection: "column",
        paddingTop: "32px",
        paddingBottom: "24px",
        paddingLeft: "16px",
        paddingRight: "16px",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 50,
      }}
    >
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-label={NAV_LABELS[id]}
            aria-current={active === id ? "page" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              width: "100%",
              padding: "12px 14px",
              borderRadius: "8px",
              background: active === id ? "rgba(0, 0, 0, 0.05)" : "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: tokens.typography.family.ui,
              fontSize: tokens.typography.size.sm,
              fontWeight: active === id ? tokens.typography.weight.bold : tokens.typography.weight.regular,
              color: active === id ? tokens.color.ink : tokens.color.muted,
              transition: "background 0.15s ease",
              borderLeft: active === id ? `3px solid ${tokens.color.sage}` : "none",
              paddingLeft: active === id ? "calc(14px - 3px)" : "14px",
            }}
          >
            <Icon width={20} height={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
