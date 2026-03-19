"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
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

const SWIPE_THRESHOLD = 0.3; // 30% of screen width

export function Flashcard({ cards, title = "Lección", onBack, onCardSwiped }: FlashcardProps) {
  const [deck, setDeck] = useState<VocabCard[]>(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Drag state
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFlying, setIsFlying] = useState<"left" | "right" | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const didDrag = useRef(false);

  const total = deck.length;
  const current = deck[index];

  // Calculate stats from cards
  const conocidas = deck.filter(c => c.known === true && c.difficulty !== "difícil").length;
  const difícil = deck.filter(c => c.difficulty === "difícil").length;
  const restantes = total - conocidas - difícil;

  const progress = total > 0 ? (index + 1) : 1;
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;

  // Handle card swipe
  const advanceCard = useCallback((direction: "left" | "right") => {
    const cardToUpdate = current;
    if (!cardToUpdate) return;

    const newCard = { ...cardToUpdate };

    if (direction === "right") {
      newCard.known = true;
      newCard.difficulty = null;
    } else {
      newCard.known = false;
      newCard.difficulty = null;
    }

    if (onCardSwiped) {
      onCardSwiped(cardToUpdate, direction);
    }

    const newDeck = [...deck];
    newDeck[index] = newCard;
    setDeck(newDeck);

    // Advance to next card
    if (index < total - 1) {
      setTimeout(() => {
        setIndex(index + 1);
        setFlipped(false);
        setDragX(0);
        setIsFlying(null);
      }, 320);
    }
  }, [index, total, current, deck, onCardSwiped]);

  // Pointer handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isFlying) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    pointerStartX.current = e.clientX;
    didDrag.current = false;
    setIsDragging(true);

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [isFlying]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || pointerStartX.current === null) return;

    const dx = e.clientX - pointerStartX.current;
    if (Math.abs(dx) > 6) {
      didDrag.current = true;
      e.preventDefault();
    }

    setDragX(dx);
  }, [isDragging]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const dx = e.clientX - (pointerStartX.current ?? e.clientX);
    const threshold = (window.innerWidth || 390) * SWIPE_THRESHOLD;

    if (didDrag.current && Math.abs(dx) >= threshold) {
      const dir = dx > 0 ? "right" : "left";
      setIsFlying(dir);
      advanceCard(dir);
    } else if (didDrag.current) {
      // Snap back
      setDragX(0);
    }

    pointerStartX.current = null;
    didDrag.current = false;
  }, [isDragging, advanceCard]);

  const onPointerCancel = useCallback(() => {
    setIsDragging(false);
    setDragX(0);
    pointerStartX.current = null;
    didDrag.current = false;
  }, []);

  // Keyboard shortcuts for desktop
  useEffect(() => {
    if (!isDesktop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFlying) return;
      if (e.key === "ArrowRight") {
        setIsFlying("right");
        advanceCard("right");
      } else if (e.key === "ArrowLeft") {
        setIsFlying("left");
        advanceCard("left");
      } else if (e.key === " ") {
        e.preventDefault();
        setFlipped(!flipped);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipped, isFlying, isDesktop, advanceCard]);

  // Calculate drag derived values
  const windowWidth = typeof window !== "undefined" ? window.innerWidth : 390;
  const dragRatio = dragX / (windowWidth * SWIPE_THRESHOLD);
  const clampedRatio = Math.max(-1, Math.min(1, dragRatio));
  const rotation = clampedRatio * 12; // Max 12deg rotation
  const showGreen = clampedRatio > 0.15;
  const showRed = clampedRatio < -0.15;
  const tintOpacity = Math.min(Math.abs(clampedRatio), 1) * 0.25;

  const getTintColor = () => {
    if (isFlying === "right") return `rgba(168, 200, 122, 0.3)`;
    if (isFlying === "left") return `rgba(242, 184, 205, 0.3)`;
    if (showGreen) return `rgba(168, 200, 122, ${tintOpacity})`;
    if (showRed) return `rgba(242, 184, 205, ${tintOpacity})`;
    return "transparent";
  };

  const getCardTransform = () => {
    if (isFlying === "right") return `translateX(120vw) rotate(20deg)`;
    if (isFlying === "left") return `translateX(-120vw) rotate(-20deg)`;
    if (isDragging || dragX !== 0) {
      return `translateX(${dragX}px) rotate(${rotation}deg)`;
    }
    return "translateX(0) rotate(0deg)";
  };

  // Stack cards
  const stackCards = [2, 1, 0].map((offset) => {
    const cardIndex = index + offset;
    if (cardIndex >= deck.length) return null;
    return { index: cardIndex, card: deck[cardIndex], offset };
  }).filter(Boolean);

  return (
    <div
      ref={containerRef}
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: PAGE_BG,
        fontFamily: FONT_UI,
        overflow: "hidden",
        touchAction: "pan-y",
      }}
    >
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

      {/* Header with back button and title */}
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
            transition: isFlying ? "none" : "width 300ms ease",
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
          transition: "all 200ms ease",
          transform: conocidas > 0 ? "scale(1.05)" : "scale(1)",
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
          transition: "all 200ms ease",
          transform: difícil > 0 ? "scale(1.05)" : "scale(1)",
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
          transition: "all 200ms ease",
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

      {/* Card stack area */}
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
        <div style={{ width: "100%", maxWidth: "560px", position: "relative", height: "100%" }}>
          {/* Stack cards in background */}
          {stackCards.length > 1 && stackCards.map((item) => {
            if (!item || item.offset === 0) return null;
            return (
              <div
                key={item.index}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#fff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "24px",
                  padding: "40px 24px",
                  transform: `translateY(${item.offset * 4}px) scale(${1 - item.offset * 0.02})`,
                  zIndex: -item.offset,
                  pointerEvents: "none",
                }}
              />
            );
          })}

          {/* Main draggable card */}
          <div
            ref={cardRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onClick={() => !isDragging && setFlipped(!flipped)}
            style={{
              position: "absolute",
              inset: 0,
              background: "#fff",
              border: `1px solid ${BORDER}`,
              borderRadius: "24px",
              padding: "40px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              cursor: isDragging ? "grabbing" : "grab",
              transform: getCardTransform(),
              transition: isFlying || isDragging ? "none" : "transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              willChange: "transform",
              touchAction: "none",
              zIndex: 10,
              overflow: "hidden",
            }}
            role="button"
            tabIndex={0}
            aria-label={`Tarjeta ${index + 1} de ${total}. ${flipped ? "Mostrar pregunta" : "Mostrar respuesta"}`}
          >
            {/* Tint overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: getTintColor(),
                transition: "background 80ms linear",
                zIndex: 2,
                pointerEvents: "none",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                padding: "20px",
              }}
            >
              {(showGreen || isFlying === "right") && (
                <div style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: SAGE,
                  opacity: Math.max(0, clampedRatio),
                }}>
                  Conocida
                </div>
              )}
              {(showRed || isFlying === "left") && (
                <div style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: ROSE,
                  opacity: Math.max(0, -clampedRatio),
                }}>
                  No sé
                </div>
              )}
            </div>

            {/* Card content */}
            <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
              {!flipped ? (
                <>
                  {/* Front: Japanese */}
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
                    margin: 0,
                    textAlign: "center",
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                  }}>
                    {current?.kana}
                  </p>
                </>
              ) : (
                <>
                  {/* Back: English and details */}
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
                    margin: "0 auto 16px",
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
        </div>
      </div>

      {/* Desktop fallback buttons (hidden on mobile) */}
      {isDesktop && (
        <div style={{
          paddingLeft: "16px",
          paddingRight: "16px",
          paddingBottom: "max(24px, env(safe-area-inset-bottom, 8px) + 16px)",
          maxWidth: "600px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          gap: "12px",
          justifyContent: "center",
        }}>
          <button
            onClick={() => {
              setIsFlying("left");
              advanceCard("left");
            }}
            disabled={isFlying !== null}
            style={{
              flex: 1,
              maxWidth: "120px",
              paddingTop: "12px",
              paddingBottom: "12px",
              background: ROSE,
              color: "#993366",
              border: "none",
              borderRadius: "24px",
              fontFamily: FONT_UI,
              fontSize: "13px",
              fontWeight: 700,
              cursor: isFlying ? "not-allowed" : "pointer",
              opacity: isFlying ? 0.5 : 1,
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isFlying) {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "scale(1.02)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = isFlying ? "0.5" : "1";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            No sé
          </button>

          <button
            onClick={() => {
              setIsFlying("right");
              advanceCard("right");
            }}
            disabled={isFlying !== null}
            style={{
              flex: 1,
              maxWidth: "120px",
              paddingTop: "12px",
              paddingBottom: "12px",
              background: SAGE,
              color: "#fff",
              border: "none",
              borderRadius: "24px",
              fontFamily: FONT_UI,
              fontSize: "13px",
              fontWeight: 700,
              cursor: isFlying ? "not-allowed" : "pointer",
              opacity: isFlying ? 0.5 : 1,
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isFlying) {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "scale(1.02)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = isFlying ? "0.5" : "1";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Conocida
          </button>
        </div>
      )}
    </div>
  );
}
