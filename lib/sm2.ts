/**
 * SM-2 Spaced Repetition Algorithm Implementation
 * Simplified two-quality version (0 = repasar/forgotten, 1 = known/correct)
 */

/**
 * Card progress tracking with SM-2 metrics
 */
export interface CardProgress {
  cardId: string;
  known: boolean;
  interval: number; // Days until next review
  easeFactor: number; // Difficulty multiplier (1.3 - 2.5)
  nextReview: string; // ISO date string (YYYY-MM-DD)
  repetitions: number; // Number of successful repetitions
}

/**
 * Legacy progress format (pre-SM-2)
 */
export interface LegacyCardProgress {
  cardId: string;
  known: boolean;
}

/**
 * Calculate next SM-2 metrics after a card is reviewed
 * @param card - Current card progress
 * @param quality - 0 = forgotten/repasar (left swipe), 1 = known/correct (right swipe)
 * @returns Updated card progress
 */
export function calculateSM2(
  card: CardProgress,
  quality: 0 | 1
): CardProgress {
  const today = getTodayString();

  if (quality === 0) {
    // Forgotten: reset interval but keep ease factor
    return {
      ...card,
      known: false,
      interval: 1,
      easeFactor: Math.max(1.3, card.easeFactor), // min 1.3, no decrease
      nextReview: addDays(today, 1),
      repetitions: 0,
    };
  }

  // quality === 1: Correct answer
  let newInterval: number;
  let newRepetitions: number;

  if (card.repetitions === 0) {
    newInterval = 1;
    newRepetitions = 1;
  } else if (card.repetitions === 1) {
    newInterval = 6;
    newRepetitions = 2;
  } else {
    newInterval = Math.round(card.interval * card.easeFactor);
    newRepetitions = card.repetitions + 1;
  }

  // Increase ease factor for correct answers
  const newEaseFactor = Math.min(2.5, card.easeFactor + 0.1);

  return {
    ...card,
    known: true,
    interval: newInterval,
    easeFactor: newEaseFactor,
    nextReview: addDays(today, newInterval),
    repetitions: newRepetitions,
  };
}

/**
 * Get cards that are due for review today or overdue
 * @param progress - Array of card progress
 * @returns Cards where nextReview <= today OR nextReview is undefined/null
 */
export function getDueCards(progress: CardProgress[]): CardProgress[] {
  // Defensive guard: if not an array, return empty array
  if (!Array.isArray(progress)) {
    return [];
  }

  const today = getTodayString();

  return progress.filter((card) => {
    // Card is due if nextReview is missing or on/before today
    if (!card.nextReview) {
      return true;
    }
    return card.nextReview <= today;
  });
}

/**
 * Migrate legacy progress format to SM-2 format
 * Non-destructive: preserves existing SM-2 fields if present
 * @param oldProgress - Array of old format progress or mixed formats
 * @returns Array of migrated CardProgress with SM-2 fields
 */
export function migrateProgress(
  oldProgress: (CardProgress | LegacyCardProgress | Record<string, unknown>)[]
): CardProgress[] {
  const today = getTodayString();

  return oldProgress.map((card) => {
    // Check if already migrated (has all SM-2 fields)
    if (
      'interval' in card &&
      'easeFactor' in card &&
      'nextReview' in card &&
      'repetitions' in card
    ) {
      // Already has SM-2 fields, return as-is
      return card as CardProgress;
    }

    // Otherwise, add defaults
    return {
      cardId: card.cardId as string,
      known: (card.known as boolean) ?? false,
      interval: (card as Partial<CardProgress>).interval ?? 1,
      easeFactor: (card as Partial<CardProgress>).easeFactor ?? 2.5,
      nextReview: (card as Partial<CardProgress>).nextReview ?? today,
      repetitions: (card as Partial<CardProgress>).repetitions ?? 0,
    };
  });
}

/**
 * Get today's date as YYYY-MM-DD string (browser local time)
 */
export function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to a date string and return new date string
 * @param dateStr - Date in YYYY-MM-DD format
 * @param days - Number of days to add
 * @returns New date in YYYY-MM-DD format
 */
export function addDays(dateStr: string, days: number): string {
  // Parse as local midnight so arithmetic matches getTodayString() (local time)
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Build today's capped study queue for a single set.
 *
 * Separates cards into two buckets:
 *   - New: card IDs that have NO progress entry (never studied)
 *   - Review: cards in progress whose nextReview <= today
 *
 * Each bucket is independently capped, then combined.
 *
 * @param allCardIds - Every card ID in the set (in order)
 * @param progress   - Existing SM-2 progress array for the set
 * @param newPerDay  - Max new cards to introduce today
 * @param reviewPerDay - Max review cards to serve today
 * @returns Set of cardIds that make up today's session
 */
export function buildDailyQueue(
  allCardIds: string[],
  progress: CardProgress[],
  newPerDay: number,
  reviewPerDay: number
): Set<string> {
  const progressIds = new Set(progress.map((p) => p.cardId));

  // New: cards with no progress entry at all (never studied)
  const newIds = allCardIds
    .filter((id) => !progressIds.has(id))
    .slice(0, newPerDay);

  // Review: cards in progress that are due today
  const reviewIds = getDueCards(progress)
    .slice(0, reviewPerDay)
    .map((p) => p.cardId);

  return new Set([...newIds, ...reviewIds]);
}

/**
 * Get review statistics for a set of cards
 * Useful for showing stats on home screen
 */
export function getReviewStats(progress: CardProgress[]): {
  totalCards: number;
  dueCount: number;
  masteredCount: number;
  reviewingCount: number;
} {
  const dueCards = getDueCards(progress);
  const masteredCards = progress.filter((c) => c.repetitions >= 3);
  const reviewingCards = progress.filter(
    (c) => c.repetitions > 0 && c.repetitions < 3
  );

  return {
    totalCards: progress.length,
    dueCount: dueCards.length,
    masteredCount: masteredCards.length,
    reviewingCount: reviewingCards.length,
  };
}
