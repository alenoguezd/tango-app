"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DailyGoal {
  minutes: 5 | 15 | 30;
  newPerDay: 5 | 10 | 20;
  reviewPerDay: 15 | 40 | 80;
}

interface GoalOption {
  id: string;
  emoji: string;
  label: string;
  description: string;
  badge: string;
  goal: DailyGoal;
  iconBg: string;
  badgeClass: string;
  projections: { months3: number; months6: number; months12: number };
}

interface OnboardingScreenProps {
  onSave: (goal: DailyGoal) => Promise<void>;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const GOALS: GoalOption[] = [
  {
    id: "casual",
    emoji: "🌱",
    label: "5 min/día",
    description: "5 nuevas · 15 repasos",
    badge: "Casual",
    goal: { minutes: 5, newPerDay: 5, reviewPerDay: 15 },
    iconBg: "bg-sage-soft",
    badgeClass: "bg-butter-light text-warning-text",
    projections: { months3: 150, months6: 350, months12: 650 },
  },
  {
    id: "recommended",
    emoji: "🔥",
    label: "15 min/día",
    description: "10 nuevas · 40 repasos",
    badge: "Recomendado",
    goal: { minutes: 15, newPerDay: 10, reviewPerDay: 40 },
    iconBg: "bg-butter-light",
    badgeClass: "bg-sage-soft text-success-text",
    projections: { months3: 300, months6: 700, months12: 1300 },
  },
  {
    id: "intensive",
    emoji: "⚡",
    label: "30 min/día",
    description: "20 nuevas · 80 repasos",
    badge: "Intensivo",
    goal: { minutes: 30, newPerDay: 20, reviewPerDay: 80 },
    iconBg: "bg-rose-soft",
    badgeClass: "bg-rose-soft text-text-primary",
    projections: { months3: 600, months6: 1400, months12: 2600 },
  },
];

const MILESTONES = [
  { words: 500,  label: "500 palabras",   sublabel: "Viaje básico a Japón" },
  { words: 1500, label: "1,500 palabras", sublabel: "Conversación cotidiana" },
  { words: 3000, label: "3,000 palabras", sublabel: "Fluidez conversacional" },
];

// Default projections shown before the user selects anything (recommended)
const DEFAULT_PROJ = GOALS[1].projections;

// ── Component ─────────────────────────────────────────────────────────────────

export function OnboardingScreen({ onSave }: OnboardingScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedOption = GOALS.find((g) => g.id === selected);
  const proj = selectedOption?.projections ?? DEFAULT_PROJ;

  async function handleStart() {
    if (!selectedOption) return;
    setSaving(true);
    try {
      await onSave(selectedOption.goal);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-dvh max-w-[390px] mx-auto flex flex-col bg-bg-page">
      {/* Safe-area top */}
      <div aria-hidden className="flex-shrink-0 h-[max(16px,env(safe-area-inset-top,0px))]" />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch] pb-[120px] px-4">

        {/* Title */}
        <div className="pt-8 pb-6">
          <h1 className="text-3xl font-bold text-text-primary leading-tight mb-2">
            ¿Cuánto tiempo tienes{" "}
            <span className="text-sage">cada día?</span>
          </h1>
          <p className="text-base text-text-secondary leading-relaxed">
            Ajustaremos cuántas tarjetas estudias para que aprendas sin agobiarte.
          </p>
        </div>

        {/* Goal option cards */}
        <div className="flex flex-col gap-3 mb-6">
          {GOALS.map((option) => {
            const isSelected = selected === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className={[
                  "flex items-center gap-3 w-full rounded-lg p-4 bg-surface text-left transition-colors",
                  isSelected
                    ? "border-2 border-sage"
                    : "border border-border-default",
                ].join(" ")}
              >
                {/* Emoji icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl ${option.iconBg}`}>
                  {option.emoji}
                </div>

                {/* Label + description */}
                <div className="flex-1 min-w-0">
                  <p className="text-md font-bold text-text-primary leading-tight">
                    {option.label}
                  </p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {option.description}
                  </p>
                </div>

                {/* Badge + radio */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${option.badgeClass}`}>
                    {option.badge}
                  </span>
                  <div className={[
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    isSelected ? "border-sage bg-sage" : "border-border-default",
                  ].join(" ")}>
                    {isSelected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Estimated progress card (dark) */}
        <div className="rounded-lg p-5 bg-text-primary mb-4">
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">
            Tu progreso estimado
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold text-white leading-none">
                {proj.months3}
              </p>
              <p className="text-xs text-white/60 mt-1">3 meses</p>
              <p className="text-xs text-white/60">palabras</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white leading-none">
                {proj.months6}
              </p>
              <p className="text-xs text-white/60 mt-1">6 meses</p>
              <p className="text-xs text-white/60">palabras</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white leading-none">
                {proj.months12}
              </p>
              <p className="text-xs text-white/60 mt-1">1 año</p>
              <p className="text-xs text-white/60">palabras</p>
            </div>
          </div>
        </div>

        {/* Milestone bars */}
        <div className="rounded-lg bg-surface border border-border-default p-4 mb-6">
          {MILESTONES.map((milestone, i) => {
            const fill = Math.min(100, Math.round((proj.months12 / milestone.words) * 100));
            return (
              <div key={milestone.words} className={i < MILESTONES.length - 1 ? "mb-4" : ""}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-md font-bold text-text-primary leading-tight">
                      {milestone.label}
                    </p>
                    <p className="text-sm text-text-secondary">{milestone.sublabel}</p>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-progress-track rounded-full overflow-hidden">
                  {/* Dynamic width — only exception to zero-inline-styles rule */}
                  <div
                    className="h-full bg-sage rounded-full transition-all duration-300"
                    style={{ width: `${fill}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Fixed bottom CTA */}
      <div className="flex-shrink-0 px-4 pt-3 pb-[max(24px,env(safe-area-inset-bottom,24px))] bg-bg-page border-t border-border-default">
        <Button
          className="w-full rounded-full text-md font-bold h-12"
          disabled={!selected || saving}
          onClick={handleStart}
        >
          {saving ? "Guardando..." : "Comenzar →"}
        </Button>
      </div>
    </div>
  );
}
