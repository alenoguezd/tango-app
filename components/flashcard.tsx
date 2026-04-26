"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, Flag } from "lucide-react";
import { toRomaji } from "wanakana";
import { tokens } from "@/lib/design-tokens";
import { FeedbackModal } from "@/components/feedback-modal";

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
  setId?: string;
  userId?: string;
  showRomaji?: boolean;
  onBack?: () => void;
  onCardSwiped?: (card: VocabCard, direction: "left" | "right", cardIndex: number) => void;
  onSessionComplete?: () => void;
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
const EXIT_ANIMATION_MS = 280;
const FLIP_TRANSITION = "transform 550ms cubic-bezier(0.22, 1, 0.36, 1)";
type SwipeDirection = "left" | "right" | "down";

// Audio functions for swipe feedback
function playCorrect() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 600;
    o.type = 'sine';
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.3);
  } catch {
    // Silently fail if AudioContext is not available
  }
}

function playWrong() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 200;
    o.type = 'sine';
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.3);
  } catch {
    // Silently fail if AudioContext is not available
  }
}

export function Flashcard({ cards, title = "Lección", setId = "", userId = "", showRomaji = false, onBack, onCardSwiped, onSessionComplete }: FlashcardProps) {
  const [deck, setDeck] = useState<VocabCard[]>(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Drag state
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null);
  const [exitingCard, setExitingCard] = useState<VocabCard | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardDimsRef = useRef({ width: 560, height: 400 });
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const didDrag = useRef(false);
  const pointerWasDrag = useRef(false); // captured before didDrag resets; guards mouse onClick
  const isExitingRef = useRef(false);

  const total = deck.length;
  const current = deck[index];
  // Use exiting card snapshot during animation, otherwise use current
  const displayCard = exitingCard || current;
  const isExiting = exitDirection !== null;
  const exampleLines = typeof displayCard?.example_usage === "string"
    ? displayCard.example_usage.split("\n")
    : [];

  // Phase 1: Fix stat calculation - separate all 4 states explicitly
  const conocidas = deck.filter(c => c.known === true).length;
  const noSé = deck.filter(c => c.known === false && c.difficulty === null).length;
  const difícil = deck.filter(c => c.difficulty === "difícil").length;

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
  // Log study activity for streak tracking
  const logStudyActivity = useCallback(() => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];

      const studyLog = localStorage.getItem("study_log");
      let log: { date: string; cardsStudied: number }[] = [];

      if (studyLog) {
        try {
          log = JSON.parse(studyLog);
        } catch {
          log = [];
        }
      }

      // Find today's entry or create new one
      const todayEntry = log.find((entry) => entry.date === todayStr);
      if (todayEntry) {
        todayEntry.cardsStudied += 1;
      } else {
        log.push({ date: todayStr, cardsStudied: 1 });
      }

      localStorage.setItem("study_log", JSON.stringify(log));
    } catch (error) {
      console.error("Error logging study activity:", error);
    }
  }, []);

  const advanceCard = useCallback((direction: SwipeDirection) => {
    if (isExitingRef.current) return;

    const cardToUpdate = deck[index];
    if (!cardToUpdate) return;

    isExitingRef.current = true;
    setExitingCard(cardToUpdate);
    setExitDirection(direction);
    setIsDragging(false);

    const newCard = { ...cardToUpdate };

    if (direction === "right") {
      newCard.known = true;
      newCard.difficulty = null;
      // Log this study activity for streak tracking
      logStudyActivity();
      playCorrect();
    } else if (direction === "down") {
      newCard.known = false;
      newCard.difficulty = "difícil";
      playWrong();
    } else {
      // left
      newCard.known = false;
      newCard.difficulty = null;
      playWrong();
    }

    if (onCardSwiped) {
      onCardSwiped(newCard, direction === "down" ? "left" : direction, index);
    }

    const newDeck = [...deck];
    newDeck[index] = newCard;
    setDeck(newDeck);

    if (index < total - 1) {
      setTimeout(() => {
        setIndex(index + 1);
        setDragX(0);
        setDragY(0);
        setFlipped(false);
        setExitingCard(null);
        setExitDirection(null);
        isExitingRef.current = false;
      }, EXIT_ANIMATION_MS);
    } else {
      // Last card was swiped - session complete
      if (onSessionComplete) {
        setTimeout(onSessionComplete, 500);
      }
    }
  }, [index, total, deck, onCardSwiped, onSessionComplete, logStudyActivity]);

  // Pointer handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isExiting) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // Suppress browser synthetic click for touch — tap is handled in onPointerUp instead
    if (e.pointerType !== "mouse") e.preventDefault();

    pointerStartX.current = e.clientX;
    pointerStartY.current = e.clientY;
    didDrag.current = false;
    pointerWasDrag.current = false;
    setIsDragging(true);

    const target = e.currentTarget as HTMLElement;
    if (typeof target.setPointerCapture === "function") {
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // Some browsers can reject capture for interrupted or synthetic pointers.
      }
    }
  }, [isExiting]);

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
      const isHorizontalDominant = Math.abs(dx) > Math.abs(dy);
      const isVerticalDominant = Math.abs(dy) > Math.abs(dx);

      if (isVerticalDominant && Math.abs(dy) > thresholdY) {
        advanceCard("down");
      } else if (isHorizontalDominant && Math.abs(dx) >= thresholdX) {
        const dir = dx > 0 ? "right" : "left";
        advanceCard(dir);
      } else {
        // Sub-threshold: snap back
        setDragX(0);
        setDragY(0);
      }
    } else if (e.pointerType !== "mouse") {
      // Touch taps are handled here because onPointerDown suppresses the
      // synthetic click. Mouse clicks are handled by onClick to avoid double flips.
      if (!isExiting) setFlipped(f => !f);
    }

    pointerWasDrag.current = didDrag.current;
    pointerStartX.current = null;
    pointerStartY.current = null;
    didDrag.current = false;
  }, [isDragging, isExiting, advanceCard]);

  const onPointerCancel = useCallback(() => {
    setIsDragging(false);
    setDragX(0);
    setDragY(0);
    pointerStartX.current = null;
    pointerStartY.current = null;
    didDrag.current = false;
  }, []);

  // Keyboard shortcuts for desktop
  useEffect(() => {
    if (!isDesktop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isExiting) return;
      if (e.key === "ArrowRight") {
        advanceCard("right");
      } else if (e.key === "ArrowLeft") {
        advanceCard("left");
      } else if (e.key === "ArrowDown") {
        advanceCard("down");
      } else if (e.key === " ") {
        e.preventDefault();
        if (!isExiting) {
          setFlipped(!flipped);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipped, isDesktop, isExiting, advanceCard]);

  // Calculate drag derived values using cached dimensions
  const thresholdX = 560 * SWIPE_THRESHOLD;
  const thresholdY = 400 * SWIPE_THRESHOLD;

  const dragRatioX = dragX / thresholdX;
  const dragRatioY = dragY / thresholdY;
  const clampedRatioX = Math.max(-1, Math.min(1, dragRatioX));
  const clampedRatioY = Math.max(0, Math.min(1, dragRatioY));

  const rotation = clampedRatioX * 8; // Keep the swipe motion restrained.
  const showGreen = clampedRatioX > 0.15;
  const showRed = clampedRatioX < -0.15;
  const showYellow = clampedRatioY > 0.15;
  const greenLabelOpacity = exitDirection === "right" ? 0.7 : Math.max(0, Math.abs(clampedRatioX) - 0.1);
  const redLabelOpacity = exitDirection === "left" ? 0.7 : Math.max(0, Math.abs(clampedRatioX) - 0.1);
  const yellowLabelOpacity = exitDirection === "down" ? 0.7 : Math.max(0, clampedRatioY - 0.1);

  const getTintColor = () => {
    // BUG 3 FIX: Card background must stay white at all times
    // No tint colors during drag or exit animation
    return "transparent";
  };

  const getCardTransform = () => {
    if (exitDirection === "right") {
      return "translateX(46%) translateY(2px) rotate(4deg) scale(0.985)";
    }
    if (exitDirection === "left") {
      return "translateX(-46%) translateY(2px) rotate(-4deg) scale(0.985)";
    }
    if (exitDirection === "down") {
      return "translateY(38%) scale(0.985)";
    }
    if (isDragging || dragX !== 0 || dragY !== 0) {
      return `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotation}deg)`;
    }
    return "translateX(0) translateY(0) rotate(0deg)";
  };

  const getCardTransition = () => {
    if (isDragging) return "none";
    if (isExiting) return `transform ${EXIT_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${EXIT_ANIMATION_MS}ms ease-out`;

    // GLITCH FIX: No transition when drag is reset (dragX=0, dragY=0)
    // This prevents snap-back animation and rotation artifacts after swipe completes
    if (dragX === 0 && dragY === 0) return "none";

    return "transform 300ms ease-out";
  };

  const getCardOpacity = () => {
    return isExiting ? 0.08 : 1;
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
            minWidth: "44px",
            minHeight: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="Volver"
        >
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: `1.5px solid ${BORDER}`,
            background: tokens.color.surface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: TEXT_SEC,
          }}>
            <ArrowLeft size={20} strokeWidth={2} />
          </div>
        </button>

        <h1 style={{
          fontSize: "24px",
          fontWeight: 800,
          color: TEXT_PRI,
          margin: 0,
        }}>
          {title}
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
          background: tokens.color.progressTrack,
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
            color: tokens.color.textWarning,
            marginBottom: "2px",
          }}>
            {difícil}
          </div>
          <div style={{
            fontSize: "12px",
            fontWeight: 600,
            color: tokens.color.textWarning,
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
        paddingTop: "16px",
        paddingBottom: "24px",
        minHeight: 0,
        overflow: "visible",
        position: "relative",
        boxSizing: "border-box",
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

            const card = item.card;

            return (
              <div
                key={item.index}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: tokens.color.surface,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "24px",
                  padding: "40px 24px",
                  transform: getStackTransform(),
                  transition: "transform 220ms ease-out",
                  zIndex: getStackZIndex(),
                  opacity: 1,
                  pointerEvents: "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                }}
              >
                <p className="text-3xl font-medium text-text-secondary text-center mb-2">
                  {card?.kanji}
                </p>
                <p className="text-4xl font-medium text-text-primary text-center leading-snug break-all">
                  {card?.kana}
                </p>
              </div>
            );
          })}

          {/* Main draggable card */}
          <div
            ref={cardRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onClick={() => {
              // Mouse-only path: touch taps are handled in onPointerUp
              if (!pointerWasDrag.current && !isExiting) {
                setFlipped(f => !f);
              }
            }}
            style={{
              position: "absolute",
              inset: 0,
              cursor: isDragging ? "grabbing" : "grab",
              transform: getCardTransform(),
              opacity: getCardOpacity(),
              transition: getCardTransition(),
              willChange: "transform",
              touchAction: "none",
              zIndex: 3,
              perspective: "1200px",
              perspectiveOrigin: "50% 50%",
            }}
            role="button"
            tabIndex={0}
            aria-label={`Tarjeta ${index + 1} de ${total}. ${flipped ? "Mostrar pregunta" : "Mostrar respuesta"}`}
          >
            {/* 3D Flipping Container */}
            <div
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
                transition: FLIP_TRANSITION,
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                willChange: "transform",
              }}
            >
              {/* Front Face */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(0deg)",
                  background: tokens.color.surface,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "24px",
                  padding: "40px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div style={{ position: "relative", zIndex: 1, width: "100%" }} className="flex flex-col justify-center flex-1">
                  <p className="text-3xl font-medium text-text-secondary text-center mb-2">
                    {displayCard?.kanji}
                  </p>
                  <p className="text-4xl font-medium text-text-primary text-center leading-snug break-all">
                    {displayCard?.kana}
                  </p>
                  {showRomaji && displayCard?.kana && (
                    <p className="text-base font-medium text-text-secondary text-center mt-3">
                      {toRomaji(displayCard.kana)}
                    </p>
                  )}
                </div>
              </div>

              {/* Back Face */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  background: tokens.color.surface,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "24px",
                  padding: "40px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                  transform: "rotateY(180deg)",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div style={{ position: "relative", zIndex: 1, width: "100%" }} className="flex flex-col justify-center flex-1">
                  <p className="text-2xl font-semibold text-text-primary text-center leading-snug mb-3">
                    {displayCard?.spanish}
                  </p>

                  <div className="w-10 h-px bg-border-default mx-auto my-3" />

                  {displayCard?.kanji && (
                    <p className="text-3xl font-medium text-text-secondary text-center mb-2">
                      {displayCard.kanji}
                    </p>
                  )}
                  {displayCard?.kana && (
                    <p className="text-lg font-medium text-text-primary text-center mb-5 break-all">
                      {displayCard.kana}
                    </p>
                  )}

                  {exampleLines.length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-text-secondary text-center mb-2">
                        Ejemplo
                      </p>
                      <p className="text-sm text-text-primary text-center leading-relaxed">
                        {exampleLines[0]}
                      </p>
                      {exampleLines[1] && (
                        <p className="text-sm text-text-secondary text-center leading-relaxed mt-1">
                          {exampleLines[1]}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Overlays (Labels, Flag) - Outside 3D container so they don't flip */}
            <div style={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none" }}>
              {/* Tint overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: getTintColor(),
                  transition: "background 80ms linear",
                  borderRadius: "24px",
                }}
              />

              {/* Labels */}
              {(showGreen || exitDirection === "right") && (
                <div
                  style={{
                    position: "absolute",
                    top: "24px",
                    left: "24px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: SAGE,
                    border: `2px solid ${SAGE}`,
                    borderRadius: "6px",
                    padding: "4px 10px",
                    transform: "rotate(-10deg)",
                    opacity: greenLabelOpacity,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    background: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  Conocida
                </div>
              )}

              {(showRed || exitDirection === "left") && (
                <div
                  style={{
                    position: "absolute",
                    top: "24px",
                    right: "24px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: ROSE,
                    border: `2px solid ${ROSE}`,
                    borderRadius: "6px",
                    padding: "4px 10px",
                    transform: "rotate(10deg)",
                    opacity: redLabelOpacity,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    background: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  No sé
                </div>
              )}

              {(showYellow || exitDirection === "down") && (
                <div
                  style={{
                    position: "absolute",
                    top: "24px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: tokens.color.textWarning,
                    border: `2px solid ${tokens.color.textWarning}`,
                    borderRadius: "6px",
                    padding: "4px 10px",
                    opacity: yellowLabelOpacity,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    background: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  Difícil
                </div>
              )}

              {/* Flag / report button */}
              {!isDragging && !isExiting && (
                <button
                  className="absolute bottom-4 right-4 w-11 h-11 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-bg-subtle"
                  aria-label="Reportar problema"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); setFeedbackOpen(true); }}
                  style={{ pointerEvents: "auto" }}
                >
                  <Flag size={16} strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard hint (desktop only) */}
      {isDesktop && (
        <div style={{
          paddingLeft: "16px",
          paddingRight: "16px",
          paddingBottom: "8px",
          maxWidth: "600px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
          textAlign: "center",
        }}>
          <p style={{
            fontSize: "12px",
            color: TEXT_SEC,
            margin: 0,
          }}>
            ← Repasar · Voltear [espacio] · Aprendida →
          </p>
        </div>
      )}

      {/* Desktop fallback buttons (hidden on mobile) */}
      {isDesktop && (() => {
        const isAnimating = isExiting;
        return (
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
              advanceCard("left");
            }}
            disabled={isAnimating}
            aria-label="Marcar como no sé"
            style={{
              flex: 1,
              maxWidth: "120px",
              paddingTop: "12px",
              paddingBottom: "12px",
              background: ROSE,
              color: tokens.color.textError,
              border: "none",
              borderRadius: "24px",
              fontFamily: FONT_UI,
              fontSize: "13px",
              fontWeight: 700,
              cursor: isAnimating ? "not-allowed" : "pointer",
              opacity: isAnimating ? 0.5 : 1,
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isAnimating) {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "scale(1.02)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = isAnimating ? "0.5" : "1";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            No sé
          </button>

          <button
            onClick={() => {
              advanceCard("down");
            }}
            disabled={isAnimating}
            aria-label="Marcar como difícil"
            style={{
              flex: 1,
              maxWidth: "120px",
              paddingTop: "12px",
              paddingBottom: "12px",
              background: BUTTER,
              color: tokens.color.textWarning,
              border: "none",
              borderRadius: "24px",
              fontFamily: FONT_UI,
              fontSize: "13px",
              fontWeight: 700,
              cursor: isAnimating ? "not-allowed" : "pointer",
              opacity: isAnimating ? 0.5 : 1,
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isAnimating) {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "scale(1.02)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = isAnimating ? "0.5" : "1";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Difícil
          </button>

          <button
            onClick={() => {
              advanceCard("right");
            }}
            disabled={isAnimating}
            aria-label="Marcar como conocida"
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
              cursor: isAnimating ? "not-allowed" : "pointer",
              opacity: isAnimating ? 0.5 : 1,
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isAnimating) {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "scale(1.02)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = isAnimating ? "0.5" : "1";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Conocida
          </button>
        </div>
        );
      })()}

      {/* Feedback modal — rendered outside the card stack so overflow:hidden doesn't clip it */}
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        cardId={displayCard?.id ?? ""}
        setId={setId}
        userId={userId}
      />
    </div>
  );
}
