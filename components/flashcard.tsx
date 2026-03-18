"use client";

import { useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw, X, Check, ArrowLeft } from "lucide-react";
import { tokens } from "@/lib/design-tokens";

export interface VocabCard {
  id?: string;
  kana: string;
  kanji: string;
  spanish: string;
  example_usage: string;
  known?: boolean;
}

interface FlashcardProps {
  cards: VocabCard[];
  title?: string;
  onBack?: () => void;
  onCardSwiped?: (card: VocabCard, direction: "left" | "right") => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CARD_BG    = "#FFFFFF";
const CARD_BORDER = "1px solid #E4E8EE";
const CARD_SHADOW = "0 4px 24px rgba(30,40,60,0.10), 0 1px 6px rgba(30,40,60,0.07)";
const CARD_SHADOW_BACK_1 = "0 3px 14px rgba(30,40,60,0.07), 0 1px 4px rgba(30,40,60,0.05)";
const CARD_SHADOW_BACK_2 = "0 2px 8px rgba(30,40,60,0.05)";
const BG_PAGE    = "#E8EEF4";

// Swipe threshold: 30% of window width
const SWIPE_THRESHOLD_RATIO = 0.30;
// Max rotation in degrees
const MAX_ROTATION = 15;
// How much drag distance maps to full rotation
const DRAG_ROTATION_FACTOR = 0.06;

export function Flashcard({ cards, title = "単語カード", onBack, onCardSwiped }: FlashcardProps) {
  const [deck, setDeck]         = useState<VocabCard[]>(cards);
  const [index, setIndex]       = useState(0);
  const [flipped, setFlipped]   = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);

  // Drag state
  const [dragX, setDragX]       = useState(0);  // current drag offset px
  const [isDragging, setIsDragging] = useState(false);
  const [isFlying, setIsFlying] = useState<"left" | "right" | null>(null);
  const [isSnapping, setIsSnapping] = useState(false);

  // Programmatic swipe flag
  const programmingSwipe = useRef(false);

  const pointerStartX  = useRef<number | null>(null);
  const pointerStartY  = useRef<number | null>(null);
  const pointerCurrentX = useRef<number>(0);
  const didDrag        = useRef(false); // true if moved enough to count as drag, not tap
  const cardRef        = useRef<HTMLDivElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);

  const total    = deck.length;
  const current  = deck[index];
  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;

  // Derived tint from drag
  const dragRatio   = dragX / (typeof window !== "undefined" ? window.innerWidth * SWIPE_THRESHOLD_RATIO : 200);
  const clampedRatio = Math.max(-1, Math.min(1, dragRatio));
  const showGreen   = clampedRatio > 0.15;
  const showRed     = clampedRatio < -0.15;
  const tintOpacity = Math.min(Math.abs(clampedRatio), 1) * 0.32;
  const iconOpacity = Math.max(0, (Math.abs(clampedRatio) - 0.15) / 0.6);

  // Rotation follows drag
  const rotation = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, dragX * DRAG_ROTATION_FACTOR));

  // Advance the deck after a fly-off
  const advance = useCallback((dir: "left" | "right") => {
    const cardSwiped = current;
    if (onCardSwiped && cardSwiped) {
      onCardSwiped(cardSwiped, dir);
    }

    const next = dir === "right"
      ? Math.min(index + 1, total - 1)
      : Math.max(index - 1, 0);
    setIndex(next);
    setFlipped(false);
    setDragX(0);
    setIsFlying(null);
    setIsSnapping(false);
    setBounceKey((k) => k + 1);
  }, [index, total, current, onCardSwiped]);

  // Trigger a programmatic fly
  const triggerFly = useCallback((dir: "left" | "right") => {
    if (isFlying || isSnapping) return;
    if (dir === "right" && index === total - 1) return;
    if (dir === "left"  && index === 0) return;

    programmingSwipe.current = true;
    setIsFlying(dir);

    setTimeout(() => {
      advance(dir);
      programmingSwipe.current = false;
    }, 320);
  }, [isFlying, isSnapping, index, total, advance]);

  // Pointer down
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isFlying || isSnapping) return;
    // Only primary button for mouse
    if (e.pointerType === "mouse" && e.button !== 0) return;

    pointerStartX.current  = e.clientX;
    pointerStartY.current  = e.clientY;
    pointerCurrentX.current = e.clientX;
    didDrag.current = false;
    setIsDragging(true);

    // Capture so we get events outside the element (important for fast drags)
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [isFlying, isSnapping]);

  // Pointer move
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || pointerStartX.current === null) return;
    const dx = e.clientX - pointerStartX.current;
    const dy = e.clientY - (pointerStartY.current ?? e.clientY);

    // If predominantly vertical, don't drag (allow page scroll on mobile)
    if (!didDrag.current && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      setIsDragging(false);
      return;
    }

    if (Math.abs(dx) > 6) {
      didDrag.current = true;
      // Prevent page scroll when dragging horizontally on touch
      e.preventDefault();
    }

    pointerCurrentX.current = e.clientX;
    setDragX(dx);
  }, [isDragging]);

  // Pointer up / cancel
  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const dx = e.clientX - (pointerStartX.current ?? e.clientX);
    const threshold = window.innerWidth * SWIPE_THRESHOLD_RATIO;

    if (didDrag.current && Math.abs(dx) >= threshold) {
      // Fly off
      const dir = dx > 0 ? "right" : "left";
      if ((dir === "right" && index < total - 1) || (dir === "left" && index > 0)) {
        setIsFlying(dir);
        setTimeout(() => advance(dir), 320);
        return;
      }
    }

    // Snap back
    if (didDrag.current && Math.abs(dx) > 6) {
      setIsSnapping(true);
      setDragX(0);
      setTimeout(() => setIsSnapping(false), 350);
    } else if (!didDrag.current) {
      // Pure tap — flip the card
      setFlipped((f) => !f);
    }

    pointerStartX.current = null;
    pointerStartY.current = null;
    didDrag.current = false;
  }, [isDragging, index, total, advance]);

  // Cancel
  const onPointerCancel = useCallback(() => {
    setIsDragging(false);
    setIsSnapping(true);
    setDragX(0);
    setTimeout(() => setIsSnapping(false), 350);
    pointerStartX.current = null;
    didDrag.current = false;
  }, []);

  // Card transform
  const getCardTransform = () => {
    if (isFlying === "right") return `translateX(120vw) rotate(${MAX_ROTATION}deg)`;
    if (isFlying === "left")  return `translateX(-120vw) rotate(-${MAX_ROTATION}deg)`;
    if (isDragging || (isSnapping && dragX !== 0)) {
      return `translateX(${dragX}px) rotate(${rotation}deg)`;
    }
    return `translateX(0px) rotate(0deg)`;
  };

  const getCardTransition = () => {
    if (isFlying)   return "transform 320ms cubic-bezier(0.4, 0, 1, 1)";
    if (isSnapping) return "transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)";
    if (isDragging) return "none";
    return "transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)";
  };

  // Tint overlay (shown on drag AND during fly-off)
  const tintColor = showGreen
    ? `rgba(72,199,116,${tintOpacity})`
    : showRed
    ? `rgba(237,80,80,${tintOpacity})`
    : isFlying === "right"
    ? "rgba(72,199,116,0.22)"
    : isFlying === "left"
    ? "rgba(237,80,80,0.18)"
    : "transparent";

  const showIcon = showGreen || showRed || isFlying !== null;

  // Shuffle / reset
  const handleShuffle = useCallback(() => {
    setFlipped(false);
    setDragX(0);
    setTimeout(() => {
      setDeck((currentDeck) => shuffle(currentDeck));
      setIndex(0);
      setShuffled(true);
      setBounceKey((k) => k + 1);
    }, 100);
  }, []);

  const handleReset = useCallback(() => {
    setFlipped(false);
    setDragX(0);
    setTimeout(() => {
      setDeck(cards);
      setIndex(0);
      setShuffled(false);
      setBounceKey((k) => k + 1);
    }, 100);
  }, [cards]);

  // Prevent context menu on long-press on mobile
  const onContextMenu = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full select-none"
      style={{ height: "100dvh", background: BG_PAGE, touchAction: "pan-y", overflow: "hidden" }}
    >
      {/* Progress bar */}
      <div className="w-full" style={{ height: "8px", background: "#D4DEE8" }}>
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            borderRadius: "0 4px 4px 0",
            background: "linear-gradient(90deg, #F4B8C8 0%, #C8A8E8 100%)",
          }}
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Tarjeta ${index + 1} de ${total}`}
        />
      </div>

      {/* Header */}
      <div
        className="flex items-center justify-between w-full px-5 pb-2"
        style={{ maxWidth: "390px", margin: "0 auto", paddingTop: "max(12px, env(safe-area-inset-top, 0px) + 8px)" }}
      >
        {/* Left header controls: back (if provided) + shuffle */}
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center justify-center rounded-full transition-all duration-200 active:scale-95"
              style={{
                width: "48px", height: "48px", minWidth: "48px", minHeight: "48px",
                background: "rgba(255,255,255,0.7)",
                color: "#7A8FA8",
                border: "1.5px solid #C8D8E8",
              }}
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={shuffled ? handleReset : handleShuffle}
            className="flex items-center justify-center rounded-full transition-all duration-200 active:scale-95"
            style={{
              width: "48px", height: "48px", minWidth: "48px", minHeight: "48px",
              background: shuffled ? "#FDE8EE" : "rgba(255,255,255,0.7)",
              color: shuffled ? "#C06080" : "#7A8FA8",
              border: `1.5px solid ${shuffled ? "#F4B8C8" : "#C8D8E8"}`,
            }}
            aria-label={shuffled ? "Restablecer orden" : "Mezclar tarjetas"}
          >
            {shuffled ? <RotateCcw className="w-4 h-4" /> : <Shuffle className="w-4 h-4" />}
          </button>
        </div>

        {/* Title */}
        <span
          className="text-sm font-bold tracking-wide text-center"
          style={{ color: "#4A5F75", fontFamily: "var(--font-nunito), var(--font-sans)", letterSpacing: "0.04em" }}
        >
          {title}
        </span>

        {/* Counter */}
        <div
          className="flex items-center justify-center text-sm font-bold tabular-nums"
          style={{ minWidth: "48px", minHeight: "48px", fontFamily: "var(--font-nunito), var(--font-sans)" }}
        >
          <span style={{ color: "#4A5F75" }}>{index + 1}</span>
          <span style={{ color: "#A8BDD0", margin: "0 2px" }}>/</span>
          <span style={{ color: "#7A8FA8" }}>{total}</span>
        </div>
      </div>

      {/* Card stack area */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-4"
        style={{ perspective: "1200px" }}
      >
        <div className="relative w-full" style={{ maxWidth: "420px" }}>

          {/* Stack card 3 — back-most */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              transform: "rotate(2.2deg) translateY(-16px) translateX(-5px)",
              background: CARD_BG, border: CARD_BORDER, borderRadius: "24px",
              boxShadow: CARD_SHADOW_BACK_2, zIndex: 0, opacity: 0.65,
            }}
          />

          {/* Stack card 2 — middle */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              transform: "rotate(-1.8deg) translateY(-9px) translateX(5px)",
              background: CARD_BG, border: CARD_BORDER, borderRadius: "24px",
              boxShadow: CARD_SHADOW_BACK_1, zIndex: 1, opacity: 0.82,
            }}
          />

          {/* Main draggable card */}
          <div
            ref={cardRef}
            key={bounceKey}
            className="relative w-full focus:outline-none"
            style={{
              zIndex: 2,
              height: "clamp(300px, 45dvh, 420px)",
              transform: getCardTransform(),
              transition: getCardTransition(),
              cursor: isDragging ? "grabbing" : "grab",
              willChange: "transform",
              touchAction: "none",
              perspective: "1000px",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onContextMenu={onContextMenu}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFlipped((f) => !f); }
              if (e.key === "ArrowRight") triggerFly("right");
              if (e.key === "ArrowLeft")  triggerFly("left");
            }}
            role="button"
            aria-label={flipped ? "Tarjeta: traducción. Presiona para ver japonés." : "Tarjeta: japonés. Presiona para revelar."}
            aria-pressed={flipped}
          >
            {/* ---- FRONT FACE ---- */}
            <div
              className="absolute inset-0"
              style={{
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                transition: (isDragging || isFlying) ? "none" : "transform 400ms ease",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <CardFace
                side="front"
                tintColor={tintColor}
                showIcon={showIcon}
                swipeDir={isFlying ?? (showGreen ? "right" : showRed ? "left" : null)}
                iconOpacity={isFlying ? 1 : iconOpacity}
              >
                {/* Paper lines */}
                <PaperLines color="#F0EFF4" />

                <div
                  className="absolute bottom-4 right-5 text-xs select-none pointer-events-none"
                  style={{ color: "#C0C8D8", opacity: 0.8 }}
                  aria-hidden="true"
                >
                  タップ →
                </div>

                <p
                  className="relative z-10 font-bold text-center leading-none mb-5 pointer-events-none"
                  lang="ja"
                  style={{
                    fontFamily: "var(--font-japanese), var(--font-sans)",
                    fontSize: "clamp(4rem, 14vw, 6rem)",
                    color: "#1E2C3E",
                  }}
                >
                  {current?.kanji}
                </p>
                <p
                  className="relative z-10 text-lg font-medium text-center pointer-events-none"
                  lang="ja"
                  style={{ fontFamily: "var(--font-japanese), var(--font-sans)", color: "#9BAFC4" }}
                >
                  {current?.kana}
                </p>
              </CardFace>
            </div>

            {/* ---- BACK FACE ---- */}
            <div
              className="absolute inset-0"
              style={{
                transform: flipped ? "rotateY(0deg)" : "rotateY(180deg)",
                transition: (isDragging || isFlying) ? "none" : "transform 400ms ease",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <CardFace
                side="back"
                tintColor={tintColor}
                showIcon={showIcon}
                swipeDir={isFlying ?? (showGreen ? "right" : showRed ? "left" : null)}
                iconOpacity={isFlying ? 1 : iconOpacity}
              >
                <PaperLines color="#F0F4F0" />

                <div
                  className="absolute bottom-4 left-5 text-xs select-none pointer-events-none"
                  style={{ color: "#C0C8D8", opacity: 0.8 }}
                  aria-hidden="true"
                >
                  ← タップ
                </div>

                <p
                  className="relative z-10 font-bold text-center text-balance leading-tight mb-4 pointer-events-none"
                  style={{
                    fontFamily: "var(--font-nunito), var(--font-sans)",
                    fontSize: "clamp(1.75rem, 8vw, 3rem)",
                    color: "#1E2C3E",
                  }}
                >
                  {current?.spanish}
                </p>

                <div
                  className="relative z-10 w-8 mb-4 pointer-events-none"
                  style={{ height: "2px", background: "#E4E8EE", borderRadius: "2px" }}
                  aria-hidden="true"
                />

                <p
                  className="relative z-10 text-sm text-center leading-relaxed text-pretty italic pointer-events-none"
                  lang="ja"
                  style={{
                    fontFamily: "var(--font-japanese), var(--font-sans)",
                    color: "#7A96A8",
                    whiteSpace: "pre-line",
                  }}
                >
                  {current?.example_usage}
                </p>
              </CardFace>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation — circle arrow buttons only, no label */}
      <div
        className="w-full flex items-center justify-between px-8 pt-2 flex-shrink-0"
        style={{
          maxWidth: "390px",
          margin: "0 auto",
          paddingBottom: "max(24px, env(safe-area-inset-bottom, 8px) + 16px)",
        }}
      >
        {/* Left / don't know */}
        <button
          onClick={() => triggerFly("left")}
          disabled={index === 0 || !!isFlying || isSnapping}
          className="flex items-center justify-center rounded-full transition-all duration-200 active:scale-90"
          style={{
            width: "56px", height: "56px", minWidth: "56px", minHeight: "56px",
            background: index === 0 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.92)",
            border: `1.5px solid ${index === 0 ? "#D8E2EC" : "#E4E8EE"}`,
            color: index === 0 ? "#C8D4E0" : "#6B7FA0",
            boxShadow: index === 0 ? "none" : "0 2px 12px rgba(30,40,60,0.10), 0 1px 4px rgba(30,40,60,0.06)",
            cursor: index === 0 ? "not-allowed" : "pointer",
          }}
          aria-label="Tarjeta anterior — no lo sé"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>

        {/* Right / I know */}
        <button
          onClick={() => triggerFly("right")}
          disabled={index === total - 1 || !!isFlying || isSnapping}
          className="flex items-center justify-center rounded-full transition-all duration-200 active:scale-90"
          style={{
            width: "56px", height: "56px", minWidth: "56px", minHeight: "56px",
            background: index === total - 1 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.92)",
            border: `1.5px solid ${index === total - 1 ? "#D8E2EC" : "#E4E8EE"}`,
            color: index === total - 1 ? "#C8D4E0" : "#6B7FA0",
            boxShadow: index === total - 1 ? "none" : "0 2px 12px rgba(30,40,60,0.10), 0 1px 4px rgba(30,40,60,0.06)",
            cursor: index === total - 1 ? "not-allowed" : "pointer",
          }}
          aria-label="Siguiente tarjeta — lo sé"
        >
          <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// ---- Sub-components ----

function PaperLines({ color }: { color: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-8 top-8 bottom-8 pointer-events-none"
      style={{
        backgroundImage: `repeating-linear-gradient(transparent, transparent 31px, ${color} 31px, ${color} 32px)`,
        opacity: 0.5,
        borderRadius: "4px",
      }}
    />
  );
}

interface CardFaceProps {
  side: "front" | "back";
  tintColor: string;
  showIcon: boolean;
  swipeDir: "left" | "right" | null;
  iconOpacity: number;
  children: React.ReactNode;
}

function CardFace({ side, tintColor, showIcon, swipeDir, iconOpacity, children }: CardFaceProps) {
  const isBack = side === "back";
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-8 py-10 overflow-hidden"
      style={{
        background: CARD_BG,
        border: CARD_BORDER,
        borderRadius: "24px",
        boxShadow: CARD_SHADOW,
      }}
    >
      {/* Tint overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "24px",
          background: tintColor,
          transition: "background 80ms linear",
          zIndex: 10,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showIcon && swipeDir === "right" && (
          <Check
            strokeWidth={3}
            style={{
              width: 64, height: 64,
              color: "rgba(34, 170, 80, 0.90)",
              opacity: iconOpacity,
              transition: "opacity 80ms linear",
              filter: "drop-shadow(0 2px 8px rgba(34,170,80,0.25))",
            }}
          />
        )}
        {showIcon && swipeDir === "left" && (
          <X
            strokeWidth={3}
            style={{
              width: 64, height: 64,
              color: "rgba(220, 60, 60, 0.90)",
              opacity: iconOpacity,
              transition: "opacity 80ms linear",
              filter: "drop-shadow(0 2px 8px rgba(220,60,60,0.25))",
            }}
          />
        )}
      </div>

      {children}
    </div>
  );
}
