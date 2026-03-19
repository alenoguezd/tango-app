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

const SWIPE_THRESHOLD = 0.3; // 30% of card width/height

export function Flashcard({ cards, title = "Lección", onBack, onCardSwiped }: FlashcardProps) {
  const [deck, setDeck] = useState<VocabCard[]>(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Drag state
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFlying, setIsFlying] = useState<"left" | "right" | "down" | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardDimsRef = useRef({ width: 560, height: 400 });
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const didDrag = useRef(false);

  const total = deck.length;
  const current = deck[index];

  // Phase 1: Fix stat calculation - separate all 4 states explicitly
  const conocidas = deck.filter(c => c.known === true).length;
  const noSé = deck.filter(c => c.known === false && c.difficulty === null).length;
  const difícil = deck.filter(c => c.difficulty === "difícil").length;
  const restantes = total - conocidas - noSé - difícil;

  const progress = total > 0 ? (index + 1) : 1;
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;

  // Phase 3: Cache card dimensions on mount and resize
  useEffect(() => {
    const updateDims = () => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        cardDimsRef.current = { width: rect.width, height: rect.height };
      }
    };

    // Update immediately
    updateDims();

    // Re-measure after next frame to catch render completion
    const timer = setTimeout(updateDims, 100);

    window.addEventListener("resize", updateDims);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateDims);
    };
  }, []);

  // Handle card swipe
  const advanceCard = useCallback((direction: "left" | "right" | "down") => {
    const cardToUpdate = current;
    if (!cardToUpdate) return;

    const newCard = { ...cardToUpdate };

    if (direction === "right") {
      newCard.known = true;
      newCard.difficulty = null;
    } else if (direction === "down") {
      newCard.known = false;
      newCard.difficulty = "difícil";
    } else {
      // left
      newCard.known = false;
      newCard.difficulty = null;
    }

    if (onCardSwiped) {
      onCardSwiped(cardToUpdate, direction === "down" ? "left" : direction);
    }

    const newDeck = [...deck];
    newDeck[index] = newCard;
    setDeck(newDeck);

    // Advance to next card
    if (index < total - 1) {
      // Switch to next card after exit animation completes (250ms)
      setTimeout(() => {
        setIndex(index + 1);
      }, 250);

      // Final cleanup: reset flying state (320ms after swipe)
      setTimeout(() => {
        setFlipped(false);
        setIsFlying(null);
      }, 320);
    }
  }, [index, total, current, deck, onCardSwiped]);

  // Pointer handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isFlying) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    pointerStartX.current = e.clientX;
    pointerStartY.current = e.clientY;
    didDrag.current = false;
    setIsDragging(true);

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [isFlying]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || pointerStartX.current === null || pointerStartY.current === null) return;

    const dx = e.clientX - pointerStartX.current;
    const dy = e.clientY - pointerStartY.current;

    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      didDrag.current = true;
      e.preventDefault();
    }

    setDragX(dx);
    setDragY(dy);
  }, [isDragging]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const dx = e.clientX - (pointerStartX.current ?? e.clientX);
    const dy = e.clientY - (pointerStartY.current ?? e.clientY);

    // Phase 3: Use cached dimensions instead of recalculating
    const dims = cardDimsRef.current;
    const thresholdX = dims.width * SWIPE_THRESHOLD;
    const thresholdY = dims.height * SWIPE_THRESHOLD;

    if (didDrag.current) {
      // Check for vertical swipe down first (higher priority)
      if (dy > thresholdY && Math.abs(dx) < thresholdX) {
        setIsFlying("down");
        setDragX(0);
        setDragY(0);
        advanceCard("down");
      } else if (Math.abs(dx) >= thresholdX && Math.abs(dy) < thresholdY) {
        // Horizontal swipe
        const dir = dx > 0 ? "right" : "left";
        setIsFlying(dir);
        setDragX(0);
        setDragY(0);
        advanceCard(dir);
      } else {
        // Snap back
        setDragX(0);
        setDragY(0);
      }
    }

    pointerStartX.current = null;
    pointerStartY.current = null;
    didDrag.current = false;
  }, [isDragging, advanceCard]);

  const onPointerCancel = useCallback(() => {
    setIsDragging(false);
    setDragX(0);
    setDragY(0);
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
        setDragX(0);
        setDragY(0);
        advanceCard("right");
      } else if (e.key === "ArrowLeft") {
        setIsFlying("left");
        setDragX(0);
        setDragY(0);
        advanceCard("left");
      } else if (e.key === "ArrowDown") {
        setIsFlying("down");
        setDragX(0);
        setDragY(0);
        advanceCard("down");
      } else if (e.key === " ") {
        e.preventDefault();
        setFlipped(!flipped);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipped, isFlying, isDesktop, advanceCard]);

  // Calculate drag derived values using cached dimensions
  const dims = cardDimsRef.current;
  const thresholdX = dims.width * SWIPE_THRESHOLD;
  const thresholdY = dims.height * SWIPE_THRESHOLD;

  const dragRatioX = dragX / thresholdX;
  const dragRatioY = dragY / thresholdY;
  const clampedRatioX = Math.max(-1, Math.min(1, dragRatioX));
  const clampedRatioY = Math.max(0, Math.min(1, dragRatioY));

  const rotation = clampedRatioX * 12; // Max 12deg rotation
  const showGreen = clampedRatioX > 0.15;
  const showRed = clampedRatioX < -0.15;
  const showYellow = clampedRatioY > 0.15;

  const getTintColor = () => {
    if (isFlying === "right") return `rgba(168, 200, 122, 0.3)`;
    if (isFlying === "left") return `rgba(242, 184, 205, 0.3)`;
    if (isFlying === "down") return `rgba(245, 220, 122, 0.3)`;
    if (showGreen) return `rgba(168, 200, 122, 0.15)`;
    if (showRed) return `rgba(242, 184, 205, 0.15)`;
    if (showYellow) return `rgba(245, 220, 122, 0.15)`;
    return "transparent";
  };

  const getCardTransform = () => {
    if (isFlying === "right") return `translateX(120vw) rotate(20deg)`;
    if (isFlying === "left") return `translateX(-120vw) rotate(-20deg)`;
    if (isFlying === "down") return `translateY(120vh) rotate(0deg)`;
    if (isDragging || dragX !== 0 || dragY !== 0) {
      return `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotation}deg)`;
    }
    return "translateX(0) translateY(0) rotate(0deg)";
  };

  const getCardTransition = () => {
    if (isDragging) return "none";
    if (isFlying) return "transform 200ms ease-out, opacity 150ms ease-out";
    return "transform 300ms ease-out";
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

      {/* Phase 2: Update counter display - replaced "restantes" with "No sé" */}
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
        {/* No sé - NEWLY ADDED */}
        <div style={{
          flex: 1,
          background: "rgba(242, 184, 205, 0.15)",
          border: `1.5px solid ${ROSE}`,
          borderRadius: "16px",
          padding: "12px 16px",
          textAlign: "center",
          transition: "all 200ms ease",
          transform: noSé > 0 ? "scale(1.05)" : "scale(1)",
        }}>
          <div style={{
            fontSize: "18px",
            fontWeight: 800,
            color: ROSE,
            marginBottom: "2px",
          }}>
            {noSé}
          </div>
          <div style={{
            fontSize: "12px",
            fontWeight: 600,
            color: ROSE,
          }}>
            no sé
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
          {/* Stack cards in background - physical deck look */}
          {stackCards.length > 1 && stackCards.map((item) => {
            if (!item || item.offset === 0) return null;

            // Stack positioning for physical deck appearance
            const getStackTransform = () => {
              if (item.offset === 1) {
                // Card 2: next card
                return "rotate(2deg) translate(3px, 6px)";
              } else if (item.offset === 2) {
                // Card 3: after next
                return "rotate(-1.5deg) translate(-4px, 10px)";
              }
              return "rotate(0deg) translate(0px, 0px)";
            };

            const getStackZIndex = () => {
              return 3 - item.offset;
            };

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
                  transform: getStackTransform(),
                  transition: isFlying ? "transform 220ms ease-out" : "none",
                  zIndex: getStackZIndex(),
                  opacity: 1,
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
              transition: getCardTransition(),
              opacity: isFlying ? 0 : 1,
              willChange: "transform",
              touchAction: "none",
              zIndex: 3,
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
              }}
            />

            {/* Phase 4: Improved label visibility with better opacity calculation */}
            {(showGreen || isFlying === "right") && (
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  zIndex: 3,
                  fontSize: "13px",
                  fontWeight: 700,
                  color: SAGE,
                  opacity: Math.max(0, Math.abs(clampedRatioX) - 0.1),
                }}
              >
                Conocida ✓
              </div>
            )}

            {(showRed || isFlying === "left") && (
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "20px",
                  zIndex: 3,
                  fontSize: "13px",
                  fontWeight: 700,
                  color: ROSE,
                  opacity: Math.max(0, Math.abs(clampedRatioX) - 0.1),
                }}
              >
                No sé
              </div>
            )}

            {(showYellow || isFlying === "down") && (
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 3,
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#8B7D00",
                  opacity: Math.max(0, clampedRatioY - 0.1),
                }}
              >
                Difícil
              </div>
            )}

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
              setIsFlying("down");
              advanceCard("down");
            }}
            disabled={isFlying !== null}
            style={{
              flex: 1,
              maxWidth: "120px",
              paddingTop: "12px",
              paddingBottom: "12px",
              background: BUTTER,
              color: "#8B7D00",
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
            Difícil
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
