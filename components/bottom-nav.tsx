"use client";

import { Home, Camera, BarChart3, User } from "lucide-react";

interface BottomNavProps {
  active: "inicio" | "crear" | "progreso" | "perfil";
  onNavigate: (tab: "inicio" | "crear" | "progreso" | "perfil") => void;
}

const FONT_UI = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const TEXT_PRI = "#1A1A1A";
const TEXT_SEC = "#8A7F74";
const BORDER = "#EEEBE6";

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
        background: "white",
        borderTop: `1px solid ${BORDER}`,
        display: "flex",
        justifyContent: "space-around",
        paddingTop: "8px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px) + 8px)",
      }}
    >
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
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
            color={active === id ? TEXT_PRI : TEXT_SEC}
          />
          <span
            style={{
              fontFamily: FONT_UI,
              fontSize: "10px",
              fontWeight: active === id ? 700 : 400,
              color: active === id ? TEXT_PRI : TEXT_SEC,
            }}
          >
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}
