import { VocabCard } from '@/components/flashcard';
import { DeckSet } from '@/components/home-screen';
import { SetProgress } from '@/components/progreso-screen';

export interface StoredSet {
  id: string;
  name: string;
  cards: VocabCard[];
  createdAt: string;
  lastStudied: string | null;
  progress: Array<{ cardId: string; known: boolean }>;
}

const STORAGE_KEY = 'tango-sets';

export function getSets(): StoredSet[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to read sets from localStorage:', error);
    return [];
  }
}

export function saveSet(set: StoredSet): void {
  if (typeof window === 'undefined') return;
  try {
    const sets = getSets();
    const index = sets.findIndex(s => s.id === set.id);
    if (index >= 0) {
      sets[index] = set;
    } else {
      sets.push(set);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  } catch (error) {
    console.error('Failed to save set to localStorage:', error);
  }
}

export function getSet(id: string): StoredSet | null {
  const sets = getSets();
  return sets.find(s => s.id === id) || null;
}

export function updateProgress(setId: string, cardId: string, known: boolean): void {
  const set = getSet(setId);
  if (!set) return;

  const progressIndex = set.progress.findIndex(p => p.cardId === cardId);
  if (progressIndex >= 0) {
    set.progress[progressIndex].known = known;
  } else {
    set.progress.push({ cardId, known });
  }

  saveSet(set);
}

export function markStudied(setId: string): void {
  const set = getSet(setId);
  if (!set) return;
  set.lastStudied = new Date().toLocaleDateString('es-ES');
  saveSet(set);
}

// Convert StoredSet to DeckSet for home screen
export function storedSetToDeckSet(set: StoredSet): DeckSet {
  const knownCount = set.progress.filter(p => p.known).length;
  const totalCards = set.cards.length;
  const progress = totalCards > 0 ? Math.round((knownCount / totalCards) * 100) : 0;

  return {
    id: set.id,
    title: set.name,
    cardCount: totalCards,
    progress,
    lastStudied: set.lastStudied || 'Nunca',
    cards: set.cards,
    color: Math.random() > 0.5 ? 'blue' : 'pink',
  };
}

// Convert StoredSet to SetProgress for progreso screen
export function storedSetToProgress(set: StoredSet): SetProgress {
  const knownCount = set.progress.filter(p => p.known).length;
  const toReviewCount = set.cards.length - knownCount;

  return {
    id: set.id,
    title: set.name,
    cardCount: set.cards.length,
    known: knownCount,
    toReview: toReviewCount,
    color: Math.random() > 0.5 ? 'blue' : 'pink',
  };
}
