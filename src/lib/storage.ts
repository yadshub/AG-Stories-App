import type { AppSettings, Story } from '../types/story';

const DB_NAME = 'kinder-geschichten-db';
const DB_VERSION = 1;
const STORE_STORIES = 'local_stories';

const SETTINGS_KEY = 'kg_settings_v1';
const VOCAB_STARS_KEY = 'kg_vocab_stars_v1';
const READ_STORIES_KEY = 'kg_read_stories_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  bedtimeMode: false,
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_STORIES)) {
        db.createObjectStore(STORE_STORIES, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getLocalStories(): Promise<Story[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_STORIES, 'readonly');
      const store = tx.objectStore(STORE_STORIES);
      const req = store.getAll();
      req.onsuccess = () => {
        const stories = (req.result as Story[]).map((s) => ({ ...s, source: 'local' as const }));
        stories.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        resolve(stories);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function getLocalStoryById(id: string): Promise<Story | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_STORIES, 'readonly');
      const store = tx.objectStore(STORE_STORIES);
      const req = store.get(id);
      req.onsuccess = () => {
        const res = req.result as Story | undefined;
        resolve(res ? { ...res, source: 'local' } : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function saveLocalStory(story: Story): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_STORIES, 'readwrite');
    tx.objectStore(STORE_STORIES).put({ ...story, source: 'local' });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteLocalStory(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_STORIES, 'readwrite');
    tx.objectStore(STORE_STORIES).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      geminiApiKey: typeof parsed.geminiApiKey === 'string' ? parsed.geminiApiKey : '',
      geminiModel:
        typeof parsed.geminiModel === 'string' && parsed.geminiModel.trim()
          ? parsed.geminiModel.trim()
          : DEFAULT_SETTINGS.geminiModel,
      bedtimeMode: Boolean(parsed.bedtimeMode),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadStarredVocab(): Set<string> {
  try {
    const raw = localStorage.getItem(VOCAB_STARS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function saveStarredVocab(stars: Set<string>): void {
  localStorage.setItem(VOCAB_STARS_KEY, JSON.stringify(Array.from(stars)));
}

export function vocabKey(article: string, word: string): string {
  return `${article.toLowerCase()}:${word.toLowerCase()}`;
}

export function loadReadStoryIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_STORIES_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function markStoryAsRead(id: string): Set<string> {
  const ids = loadReadStoryIds();
  ids.add(id);
  localStorage.setItem(READ_STORIES_KEY, JSON.stringify(Array.from(ids)));
  return ids;
}
