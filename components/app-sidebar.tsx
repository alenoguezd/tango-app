"use client";

import { FolderOpen, Play } from "lucide-react";
import { tokens } from "@/lib/design-tokens";

interface AppSidebarProps {
  activeTab: "inicio" | "crear" | "progreso" | "perfil";
  onNavigate: (tab: "inicio" | "crear" | "progreso" | "perfil") => void;
}

export function AppSidebar({ activeTab, onNavigate }: AppSidebarProps) {
  return (
    <div style={{
      width: "220px",
      height: "100dvh",
      background: tokens.color.surface,
      borderRight: `1px solid ${tokens.color.bgGrey}`,
      display: "flex",
      flexDirection: "column",
      padding: "24px 16px",
      gap: "20px",
      flexShrink: 0,
    }}>
      {/* App name */}
      <h1 style={{
        fontFamily: "var(--font-japanese), var(--font-sans)",
        fontSize: "24px",
        fontWeight: 700,
        color: tokens.color.ink,
        letterSpacing: "-0.02em",
        margin: 0,
        textAlign: "center",
      }}>
        単語
      </h1>

      {/* Navigation */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        <SidebarNavItem
          label="Inicio"
          icon={<SmileIcon />}
          active={activeTab === "inicio"}
          onClick={() => onNavigate("inicio")}
        />
        <SidebarNavItem
          label="Crear"
          icon={<FolderOpen style={{ width: "22px", height: "22px", strokeWidth: 1.8 }} />}
          active={activeTab === "crear"}
          onClick={() => onNavigate("crear")}
        />
        <SidebarNavItem
          label="Progreso"
          icon={<Play style={{ width: "20px", height: "20px", strokeWidth: 1.8 }} />}
          active={activeTab === "progreso"}
          onClick={() => onNavigate("progreso")}
        />
        <SidebarNavItem
          label="Perfil"
          icon={<PersonIcon />}
          active={activeTab === "perfil"}
          onClick={() => onNavigate("perfil")}
        />
      </nav>
    </div>
  );
}

function SidebarNavItem({
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
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 14px",
        borderRadius: "10px",
        background: active ? tokens.color.navPill : "transparent",
        border: "none",
        cursor: "pointer",
        width: "100%",
        fontFamily: "var(--font-sans)",
        fontSize: "15px",
        fontWeight: active ? 600 : 400,
        color: active ? tokens.color.ink : tokens.color.muted,
        transition: "background 0.15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "inherit" }}>
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

function PersonIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 20c0-4.418 4.03-8 9-8s9 3.582 9 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
