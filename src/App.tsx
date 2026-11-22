import { useCallback, useEffect, useState } from 'react';
import { BookMarked, BookOpen, Moon, RefreshCw, Settings, Sun, Wand2 } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import type { AppSettings, Story, StoryIndexEntry, VocabWord } from './types/story';
import {
  deleteLocalStory,
  loadReadStoryIds,
  loadSettings,
  loadStarredVocab,
  markStoryAsRead,
  saveLocalStory,
  saveSettings,
  saveStarredVocab,
  vocabKey,
} from './lib/storage';
import { loadAllStoryEntries, loadStoryDetail, shareOrExportStory } from './lib/storyService';
import { StoryShelf } from './components/StoryShelf';
import { StoryReader } from './components/StoryReader';
import { VocabBank } from './components/VocabBank';
import { StoryGenerator } from './components/StoryGenerator';
import { SettingsModal } from './components/SettingsModal';

type TabId = 'shelf' | 'vocab' | 'create';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('shelf');
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [stories, setStories] = useState<StoryIndexEntry[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [loadingStoryError, setLoadingStoryError] = useState<string | null>(null);
  const [starredVocab, setStarredVocab] = useState<Set<string>>(() => loadStarredVocab());
  const [readStoryIds, setReadStoryIds] = useState<Set<string>>(() => loadReadStoryIds());
  const [showSettings, setShowSettings] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // Apply bedtime dim class to root document
  useEffect(() => {
    document.documentElement.classList.toggle('bedtime', settings.bedtimeMode);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', settings.bedtimeMode ? '#1D1814' : '#FDF6EC');
    }
  }, [settings.bedtimeMode]);

  const refreshStories = useCallback(async () => {
    setLoadingStories(true);
    try {
      const entries = await loadAllStoryEntries();
      setStories(entries);
    } finally {
      setLoadingStories(false);
    }
  }, []);

  useEffect(() => {
    refreshStories();
  }, [refreshStories]);

  const handleSaveSettings = (next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  const handleToggleBedtime = () => {
    handleSaveSettings({ ...settings, bedtimeMode: !settings.bedtimeMode });
  };

  const handleSelectStory = async (entry: StoryIndexEntry) => {
    setLoadingStoryError(null);
    try {
      const fullStory = await loadStoryDetail(entry);
      setActiveStory(fullStory);
    } catch (err) {
      setLoadingStoryError(
        err instanceof Error ? err.message : 'Geschichte konnte nicht geöffnet werden.'
      );
    }
  };

  const handleDeleteLocalStory = async (id: string) => {
    await deleteLocalStory(id);
    await refreshStories();
  };

  const handleShareLocalStory = async (entry: StoryIndexEntry) => {
    const story = await loadStoryDetail(entry);
    await shareOrExportStory(story);
  };

  const handleStoryCreated = async (story: Story) => {
    await saveLocalStory(story);
    await refreshStories();
    setActiveTab('shelf');
    setActiveStory(story);
  };

  const handleImportStory = async (story: Story) => {
    await saveLocalStory(story);
    await refreshStories();
  };

  const handleToggleVocabStar = (word: VocabWord) => {
    const key = vocabKey(word.article, word.word);
    setStarredVocab((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      saveStarredVocab(next);
      return next;
    });
  };

  const handleCompleteStory = (storyId: string) => {
    setReadStoryIds(markStoryAsRead(storyId));
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--bg-page)] text-[var(--text-main)]">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 pt-safe bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-soft)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-10 w-10 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center text-2xl shrink-0">
              🐻
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-black leading-tight truncate">Tier-Geschichten</h1>
              <p className="text-[11px] font-bold text-[var(--text-muted)] truncate">
                Schweizer Hochdeutsch Bilderbücher
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleBedtime}
              aria-label="Schlafenszeit-Modus umschalten"
              className="h-10 w-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center cursor-pointer"
            >
              {settings.bedtimeMode ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              aria-label="Einstellungen"
              className="h-10 w-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center cursor-pointer"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* PWA New Stories Available Banner */}
      {needRefresh && (
        <div className="bg-[var(--accent)] text-[var(--accent-text)] px-4 py-2.5">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <span className="text-xs sm:text-sm font-extrabold">
              Neue Geschichten verfügbar!
            </span>
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-black cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Aktualisieren</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-4 pb-28">
        {loadingStoryError && (
          <div className="mb-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm font-bold text-rose-700">
            {loadingStoryError}
          </div>
        )}

        {activeTab === 'shelf' && (
          <StoryShelf
            stories={stories}
            readStoryIds={readStoryIds}
            loading={loadingStories}
            onSelectStory={handleSelectStory}
            onDeleteLocalStory={handleDeleteLocalStory}
            onShareLocalStory={handleShareLocalStory}
            onOpenGenerator={() => setActiveTab('create')}
          />
        )}

        {activeTab === 'vocab' && (
          <VocabBank
            stories={stories}
            starredVocab={starredVocab}
            onToggleStar={handleToggleVocabStar}
          />
        )}

        {activeTab === 'create' && (
          <StoryGenerator
            settings={settings}
            existingTitles={stories.map((s) => s.title)}
            onStoryCreated={handleStoryCreated}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
      </main>

      {/* Android-friendly Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-[var(--bg-card)]/95 backdrop-blur-md border-t border-[var(--border-soft)] pb-safe">
        <div className="max-w-md mx-auto px-4 pt-2 flex items-center justify-around">
          <button
            type="button"
            onClick={() => setActiveTab('shelf')}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-colors cursor-pointer ${
              activeTab === 'shelf'
                ? 'text-[var(--accent)] bg-[var(--accent-soft)]/70'
                : 'text-[var(--text-muted)]'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-[11px] font-extrabold">Geschichten</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vocab')}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-colors cursor-pointer ${
              activeTab === 'vocab'
                ? 'text-[var(--accent)] bg-[var(--accent-soft)]/70'
                : 'text-[var(--text-muted)]'
            }`}
          >
            <BookMarked className="h-5 w-5" />
            <span className="text-[11px] font-extrabold">Wortschatz</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-colors cursor-pointer ${
              activeTab === 'create'
                ? 'text-[var(--accent)] bg-[var(--accent-soft)]/70'
                : 'text-[var(--text-muted)]'
            }`}
          >
            <Wand2 className="h-5 w-5" />
            <span className="text-[11px] font-extrabold">Neu</span>
          </button>
        </div>
      </nav>

      {/* Full-Screen Story Reader + 5 Q&A Cards */}
      {activeStory && (
        <StoryReader
          story={activeStory}
          bedtimeMode={settings.bedtimeMode}
          starredVocab={starredVocab}
          onToggleBedtime={handleToggleBedtime}
          onToggleVocabStar={handleToggleVocabStar}
          onCompleteStory={handleCompleteStory}
          onClose={() => setActiveStory(null)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onImportStory={handleImportStory}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
