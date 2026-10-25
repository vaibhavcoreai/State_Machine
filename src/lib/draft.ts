import type { MatchMetadata } from '../components/Header';
import type { TeamMatchData } from './stats';

export interface MatchDraft {
  id: string; // match UUID or local draft id
  meta: MatchMetadata;
  teamAId: string;
  teamBId: string;
  teamA: TeamMatchData;
  teamB: TeamMatchData;
  currentQuarter: string;
  version: number;
  updatedAt: number;
  isPersistedInDB?: boolean; // true = row already exists in DB, use UPDATE
}

const DB_NAME = 'vv_stats_db';
const STORE_NAME = 'match_drafts';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save draft to IndexedDB keyed by match id
 */
export async function saveDraft(draft: MatchDraft): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(draft);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save draft to IndexedDB:', err);
  }
}

/**
 * Get latest unsaved draft if one exists
 */
export async function getLatestDraft(): Promise<MatchDraft | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const drafts: MatchDraft[] = req.result || [];
        if (drafts.length === 0) {
          resolve(null);
          return;
        }
        // sort by updatedAt descending
        drafts.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(drafts[0]);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get draft from IndexedDB:', err);
    return null;
  }
}

/**
 * Clear a specific draft by match id
 */
export async function clearDraft(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to clear draft from IndexedDB:', err);
  }
}
