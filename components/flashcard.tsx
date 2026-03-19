"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronLeft, ArrowLeft } from "lucide-react";
import { tokens } from "@/lib/design-tokens";

export interface VocabCard {
  id?: string;
  kana: string;
  kanji: string;
  spanish: string;
  example_usage: string;
  known?: boolean;
  difficulty?: "fácil" | "difícil" | null;
}

interface FlashcardProps {
  cards: VocabCard[];
  title?: string;
  onBack?: () => void;
  onCardSwiped?: (card: VocabCard, direction: "left" | "right") => void;
}

const FONT_UI = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const TEXT_PRI = tokens.color.ink;
const TEXT_SEC = tokens.color.muted;
const SAGE = tokens.color.sage;
const ROSE = tokens.color.rose;
const BUTTER = tokens.color.butter;
const BORDER = tokens.color.border;
const PAGE_BG = tokens.color.page;

// Swipe detection constants
const SWIPE_THRESHOLD = 50; // pixels
const SWIPE_VERTICAL_THRESHOLD = 80; // pixels for down swipe

export function Flashcard({ cards, title = "Lección", onBack, onCardSwiped }: FlashcardProps) {
  const [deck, setDeck] = useState<VocabCard[]>(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  // Swipe detection
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const total = deck.length;
  const current = deck[index];

  // Initialize session counters
  const conocidas = deck.filter(c => c.known === true && c.difficulty !== "difícil").length;
  const difícil = deck.filter(c => c.difficulty === "difícil").length;
  const restantes = total - conocidas - difícil;

  const progress = total > 0 ? (index + 1) : 1;

  const handleSwipe = useCallback((direction: "up" | "down" | "left" | "right") => {
    const cardToUpdate = current;
    if (!cardToUpdate || !flipped) return;

    let response: "conocida" | "difícil" | "no_se" | null = null;

    if (direction === "right") {
      response = "conocida";
    } else if (direction === "left") {
      response = "no_se";
    } else if (direction === "down") {
      response = "difícil";
    }

    if (!response) return;

    // Update card state
    const newCard = { ...cardToUpdate };

    if (response === "conocida") {
      newCard.known = true;
      newCard.difficulty = null;
      if (onCardSwiped) onCardSwiped(cardToUpdate, "right");
    } else if (response === "difícil") {
      newCard.known = false;
      newCard.difficulty = "difícil";
      if (onCardSwiped) onCardSwiped(cardToUpdate, "left");
    } else {
      // "no_se"
      newCard.known = false;
      newCard.difficulty = null;
      if (onCardSwiped) onCardSwiped(cardToUpdate, "left");
    }

    // Update deck
    const newDeck = [...deck];
    newDeck[index] = newCard;
    setDeck(newDeck);

    // Advance to next card
    if (index < total - 1) {
      setIndex(index + 1);
      setFlipped(false);
      setShowButtons(false);
    }
  }, [index, total, current, deck, flipped, onCardSwiped]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const deltaX = endX - touchStartX.current;
    const deltaY = endY - touchStartY.current;

    // Check for swipe down first (higher threshold)
    if (deltaY > SWIPE_VERTICAL_THRESHOLD && Math.abs(deltaX) < 30) {
      handleSwipe("down");
    } else if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaY) < 30) {
      // Horizontal swipe
      if (deltaX > 0) {
        handleSwipe("right");
      } else {
        handleSwipe("left");
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [handleSwipe]);

  const handleCardClick = useCallback(() => {
    if (!flipped) {
      setFlipped(true);
      // Show buttons after a brief delay
      setTimeout(() => setShowButtons(true), 100);
    }
  }, [flipped]);

  const handleResponse = useCallback((response: "conocida" | "difícil" | "no_se") => {
    handleSwipe(
      response === "conocida" ? "right" : response === "no_se" ? "left" : "down"
    );
  }, [handleSwipe]);

  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: PAGE_BG,
      fontFamily: FONT_UI,
      overflow: "hidden",
    }}>
      {/* Top bar with time and dots */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "max(12px, env(safe-area-inset-top, 0px) + 8px)",
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingBottom: "12px",
        color: TEXT_SEC,
        fontSize: "13px",
        fontWeight: 500,
      }}>
        <span>9:41</span>
        <div style={{
          display: "flex",
          gap: "6px",
          alignItems: "center",
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: i < Math.ceil((index + 1) / (total / 3)) ? TEXT_SEC : "#E0DCD4",
              }}
            />
          ))}
        </div>
      </div>

      {/* Header with back button and title only */}
      <div style={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "16px",
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingBottom: "20px",
        maxWidth: "600px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}>
        <button
          onClick={onBack}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: `1.5px solid ${BORDER}`,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: TEXT_SEC,
          }}
          aria-label="Volver"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>

        <h1 style={{
          fontSize: "24px",
          fontWeight: 800,
          color: TEXT_PRI,
          margin: 0,
        }}>
          Lección {index + 1}
        </h1>
      </div>

      {/* Progress bar and counter */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingBottom: "20px",
        maxWidth: "600px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}>
        <div style={{
          flex: 1,
          height: "6px",
          background: "#E0DCD4",
          borderRadius: "3px",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${((index + 1) / total) * 100}%`,
            background: TEXT_PRI,
            transition: "width 300ms ease",
          }} />
        </div>
        <span style={{
          fontSize: "13px",
          color: TEXT_SEC,
          fontWeight: 600,
          minWidth: "50px",
          textAlign: "right",
        }}>
          {progress} / {total}
        </span>
      </div>

      {/* Status cards */}
      <div style={{
        display: "flex",
        gap: "12px",
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingBottom: "24px",
        maxWidth: "600px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
        justifyContent: "center",
      }}>
        {/* Conocidas */}
        <div style={{
          flex: 1,
          background: "rgba(168, 200, 122, 0.15)",
          border: `1.5px solid ${SAGE}`,
          borderRadius: "16px",
          padding: "12px 16px",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: "18px",
            fontWeight: 800,
            color: SAGE,
            marginBottom: "2px",
          }}>
            {conocidas}
          </div>
          <div style={{
            fontSize: "12px",
            fontWeight: 600,
            color: SAGE,
          }}>
            conocidas
          </div>
        </div>

        {/* Difícil */}
        <div style={{
          flex: 1,
          background: "rgba(245, 220, 122, 0.15)",
          border: `1.5px solid ${BUTTER}`,
          borderRadius: "16px",
          padding: "12px 16px",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: "18px",
            fontWeight: 800,
            color: "#8B7D00",
            marginBottom: "2px",
          }}>
            {difícil}
          </div>
          <div style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#8B7D00",
          }}>
            difícil
          </div>
        </div>

        {/* Restantes */}
        <div style={{
          flex: 1,
          background: "rgba(200, 200, 200, 0.1)",
          border: `1.5px solid #E0DCD4`,
          borderRadius: "16px",
          padding: "12px 16px",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: "18px",
            fontWeight: 800,
            color: TEXT_SEC,
            marginBottom: "2px",
          }}>
            {restantes}
          </div>
          <div style={{
            fontSize: "12px",
            fontWeight: 600,
            color: TEXT_SEC,
          }}>
            restantes
          </div>
        </div>
      </div>

      {/* Main flashcard */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingBottom: "24px",
        minHeight: 0,
        overflow: "hidden",
        position: "relative",
      }}>
        <div
          ref={cardRef}
          onClick={handleCardClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            width: "100%",
            maxWidth: "560px",
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: "24px",
            padding: "40px 24px",
            minHeight: "300px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            cursor: !flipped ? "pointer" : "default",
            transition: "all 200ms ease",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            if (!flipped) {
              e.currentTarget.style.boxShadow = "0 4px 24px rgba(30,40,60,0.10)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {!flipped ? (
            <>
              {/* Front face: Japanese only */}
              <p style={{
                fontSize: "clamp(36px, 10vw, 56px)",
                fontWeight: 800,
                color: TEXT_PRI,
                margin: "0 0 12px 0",
                textAlign: "center",
                lineHeight: 1,
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}>
                {current?.kanji}
              </p>
              <p style={{
                fontSize: "14px",
                color: "#5B9FD8",
                margin: "0 0 32px 0",
                textAlign: "center",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}>
                {current?.kana}
              </p>

              {/* Tap hint pill */}
              <div style={{
                background: "#F5F2EC",
                color: TEXT_SEC,
                padding: "6px 12px",
                borderRadius: "50px",
                fontSize: "9px",
                fontWeight: 600,
                textAlign: "center",
              }}>
                Toca para ver respuesta
              </div>

              {/* Ghost swipe hints */}
              <div style={{
                position: "absolute",
                left: 0,
                top: "50%",
                width: "8px",
                height: "60px",
                transform: "translateY(-50%)",
                background: ROSE,
                opacity: 0.25,
                borderRadius: "0 4px 4px 0",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute",
                right: 0,
                top: "50%",
                width: "8px",
                height: "60px",
                transform: "translateY(-50%)",
                background: SAGE,
                opacity: 0.25,
                borderRadius: "4px 0 0 4px",
                pointerEvents: "none",
              }} />
            </>
          ) : (
            <>
              {/* Back face: English and details */}
              <p style={{
                fontSize: "clamp(20px, 6vw, 32px)",
                fontWeight: 800,
                color: TEXT_PRI,
                margin: "0 0 16px 0",
                textAlign: "center",
                lineHeight: 1.2,
              }}>
                {current?.spanish}
              </p>

              <div style={{
                width: "40px",
                height: "2px",
                background: BORDER,
                marginBottom: "16px",
              }} />

              <p style={{
                fontSize: "12px",
                color: TEXT_SEC,
                margin: "0 0 8px 0",
                textAlign: "center",
              }}>
                {current?.kanji && `${current.kanji} · `}
                <span style={{ fontStyle: "italic" }}>v. transitivo</span>
              </p>

              <p style={{
                fontSize: "13px",
                color: TEXT_SEC,
                margin: "0 0 8px 0",
                textAlign: "center",
                fontWeight: 600,
              }}>
                Ejemplo
              </p>

              <p style={{
                fontSize: "12px",
                color: TEXT_PRI,
                margin: "0 0 4px 0",
                textAlign: "center",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}>
                {current?.example_usage?.split("\n")[0]}
              </p>

              {current?.example_usage?.split("\n")[1] && (
                <p style={{
                  fontSize: "12px",
                  color: TEXT_SEC,
                  margin: "0",
                  textAlign: "center",
                }}>
                  {current.example_usage.split("\n")[1]}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom: Assessment buttons (only show on back face) */}
      {flipped && (
        <div style={{
          paddingLeft: "16px",
          paddingRight: "16px",
          paddingBottom: "max(24px, env(safe-area-inset-bottom, 8px) + 16px)",
          maxWidth: "600px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
          animation: showButtons ? "slideUp 200ms ease forwards" : "none",
        }}>
          <p style={{
            fontSize: "14px",
            fontWeight: 600,
            color: TEXT_PRI,
            textAlign: "center",
            marginBottom: "12px",
          }}>
            ¿Cómo te fue?
          </p>

          <div style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
          }}>
            <button
              onClick={() => handleResponse("no_se")}
              style={{
                flex: 1,
                maxWidth: "120px",
                paddingTop: "12px",
                paddingBottom: "12px",
                paddingLeft: "16px",
                paddingRight: "16px",
                background: ROSE,
                color: "#993366",
                border: "none",
                borderRadius: "24px",
                fontFamily: FONT_UI,
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              No sé
            </button>

            <button
              onClick={() => handleResponse("difícil")}
              style={{
                flex: 1,
                maxWidth: "120px",
                paddingTop: "12px",
                paddingBottom: "12px",
                paddingLeft: "16px",
                paddingRight: "16px",
                background: BUTTER,
                color: "#8B7D00",
                border: "none",
                borderRadius: "24px",
                fontFamily: FONT_UI,
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Difícil
            </button>

            <button
              onClick={() => handleResponse("conocida")}
              style={{
                flex: 1,
                maxWidth: "120px",
                paddingTop: "12px",
                paddingBottom: "12px",
                paddingLeft: "16px",
                paddingRight: "16px",
                background: SAGE,
                color: "#fff",
                border: "none",
                borderRadius: "24px",
                fontFamily: FONT_UI,
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Conocida
            </button>
          </div>

          <style>{`
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
