"use client";

import { Home, Camera, BarChart3, User } from "lucide-react";
import { tokens } from "@/lib/design-tokens";

interface BottomNavProps {
  active: "inicio" | "crear" | "progreso" | "perfil";
  onNavigate: (tab: "inicio" | "crear" | "progreso" | "perfil") => void;
}

const NAV_LABELS = {
  inicio: "Ir a Inicio",
  crear: "Ir a Crear",
  progreso: "Ir a Progreso",
  perfil: "Ir a Perfil",
};

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  const items = [
    { id: "inicio" as const, label: "Inicio", icon: Home },
    { id: "crear" as const, label: "Crear", icon: Camera },
    { id: "progreso" as const, label: "Progreso", icon: BarChart3 },
    { id: "perfil" as const, label: "Perfil", icon: User },
  ];

  return (
    <nav
      style={{
        flexShrink: 0,
        width: "100%",
        background: tokens.color.surface,
        borderTop: `1px solid ${tokens.color.border}`,
        display: "flex",
        justifyContent: "space-around",
        paddingTop: tokens.spacing["3"],
        paddingBottom: `max(${tokens.spacing["5"]}, env(safe-area-inset-bottom, 0px) + ${tokens.spacing["3"]})`,
      }}
    >
      {items.map(({ id, label, icon: Icon }) => (
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
