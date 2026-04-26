"use client";

import { tokens } from "@/lib/design-tokens";

const FONT = "var(--font-sans)";
const W = tokens.color.surface;
const BG_PAGE = tokens.color.page;
const TEXT_PRI = tokens.color.ink;
const TEXT_SEC = tokens.color.muted;
const ROSE = tokens.color.rose;
const BUTTER = tokens.color.butter;
const SAGE = tokens.color.sage;

interface SessionCompleteProps {
  setName: string;
  total: number;
  noSe: number;
  dificil: number;
  conocidas: number;
  previousMastery: number;
  streakDays: number;
  onReviewDifficult: () => void;
  onGoHome: () => void;
  onStudyAnother: () => void;
}

export function SessionComplete({
  setName,
  total,
  noSe,
  dificil,
  conocidas,
  previousMastery,
  streakDays,
  onReviewDifficult,
  onGoHome,
  onStudyAnother,
}: SessionCompleteProps) {
  const isPerfect = noSe === 0 && dificil === 0;
  const currentMastery = Math.round((conocidas / total) * 100);
  const masteryGain = currentMastery - previousMastery;
  const masteryGainText =
    masteryGain > 0 ? `+${masteryGain} pts de dominio` : "Dominio sin cambios";

  return (
    <div
      style={{
        height: "100dvh",
        background: BG_PAGE,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: isPerfect ? tokens.color.bgSageSuccess : tokens.color.bgButterLight,
            border: `3px solid ${isPerfect ? SAGE : BUTTER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
            fontSize: "56px",
          }}
        >
          {isPerfect ? "⭐" : "🏆"}
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: FONT,
            fontSize: "32px",
            fontWeight: 800,
            color: TEXT_PRI,
            margin: "0 0 8px",
            textAlign: "center",
          }}
        >
          {isPerfect ? "¡Perfecto!" : "¡Sesión completa!"}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: FONT,
            fontSize: "14px",
            color: TEXT_SEC,
            margin: "0 0 24px",
            textAlign: "center",
          }}
        >
          {setName} · {total} tarjetas
          {isPerfect && " · todas conocidas"}
          {` · ${streakDays} días de racha`}
        </p>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isPerfect ? "repeat(3, 1fr)" : "repeat(3, 1fr)",
            gap: "12px",
            width: "100%",
            marginBottom: "24px",
          }}
        >
          {/* No sé */}
          <div
            style={{
              background: isPerfect ? tokens.color.bgSubtle : ROSE,
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
              opacity: isPerfect ? 0.5 : 1,
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontSize: "24px",
                fontWeight: 700,
                color: isPerfect ? TEXT_SEC : tokens.color.textError,
                marginBottom: "4px",
              }}
            >
              {noSe}
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: "12px",
                color: isPerfect ? TEXT_SEC : tokens.color.textError,
                fontWeight: 500,
              }}
            >
              no sé
            </div>
          </div>

          {/* Difícil */}
          <div
            style={{
              background: isPerfect ? tokens.color.bgSubtle : BUTTER,
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
              opacity: isPerfect ? 0.5 : 1,
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontSize: "24px",
                fontWeight: 700,
                color: isPerfect ? TEXT_SEC : tokens.color.textWarning,
                marginBottom: "4px",
              }}
            >
              {dificil}
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: "12px",
                color: isPerfect ? TEXT_SEC : tokens.color.textWarning,
                fontWeight: 500,
              }}
            >
              difícil
            </div>
          </div>

          {/* Conocidas */}
          <div
            style={{
              background: SAGE,
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontSize: "24px",
                fontWeight: 700,
                color: tokens.color.textSuccess,
                marginBottom: "4px",
              }}
            >
              {conocidas}
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: "12px",
                color: tokens.color.textSuccess,
                fontWeight: 500,
              }}
            >
              conocidas
            </div>
          </div>
        </div>

        {/* Mastery Card */}
        <div
          style={{
            width: "100%",
            background: isPerfect ? tokens.color.bgSageSuccess : W,
            border: isPerfect ? `1px solid ${SAGE}` : "1px solid #EEEBE6",
            borderRadius: "14px",
            padding: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3
              style={{
                fontFamily: FONT,
                fontSize: "14px",
                fontWeight: 700,
                color: TEXT_PRI,
                margin: 0,
              }}
            >
              Dominio del set
            </h3>
            <span
              style={{
                fontFamily: FONT,
                fontSize: "14px",
                fontWeight: 700,
                color: isPerfect ? SAGE : BUTTER,
              }}
            >
              {previousMastery}% → {currentMastery}%
            </span>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "6px",
              borderRadius: "3px",
              background: tokens.color.bgGrey,
              marginBottom: "8px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: `${currentMastery}%`,
                background: isPerfect ? SAGE : BUTTER,
                borderRadius: "3px",
                transition: "width 0.6s ease-out",
              }}
            />
          </div>

          <p
            style={{
              fontFamily: FONT,
              fontSize: "12px",
              color: TEXT_SEC,
              margin: 0,
            }}
          >
            {conocidas}/{total} tarjetas dominadas · {masteryGainText}
          </p>
        </div>

        {/* CTAs */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {isPerfect ? (
            <>
              <button
                onClick={onGoHome}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: TEXT_PRI,
                  color: W,
                  border: "none",
                  borderRadius: "12px",
                  fontFamily: FONT,
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Volver al inicio
              </button>
              <button
                onClick={onStudyAnother}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "transparent",
                  color: TEXT_SEC,
                  border: `1.5px solid ${TEXT_SEC}`,
                  borderRadius: "12px",
                  fontFamily: FONT,
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Estudiar otro set
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onReviewDifficult}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: TEXT_PRI,
                  color: W,
                  border: "none",
                  borderRadius: "12px",
                  fontFamily: FONT,
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Repasar las {noSe} difíciles →
              </button>
              <button
                onClick={onGoHome}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "transparent",
                  color: TEXT_PRI,
                  border: `1.5px solid ${TEXT_PRI}`,
                  borderRadius: "12px",
                  fontFamily: FONT,
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Volver al inicio
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
