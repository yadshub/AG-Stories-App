import { useState } from 'react';
import { BookOpen, CheckCircle2, Share2, Sparkles, Trash2 } from 'lucide-react';
import type { Story, StoryIndexEntry } from '../types/story';
import { SafeSvg } from './SafeSvg';

interface StoryShelfProps {
  stories: StoryIndexEntry[];
  readStoryIds: Set<string>;
  loading: boolean;
  onSelectStory: (entry: StoryIndexEntry) => void;
  onDeleteLocalStory: (id: string) => Promise<void>;
  onShareLocalStory: (entry: StoryIndexEntry) => Promise<void>;
  onOpenGenerator: () => void;
}

function articleClass(article: string): string {
  if (article === 'der') return 'bg-[var(--der-bg)] text-[var(--der-text)]';
  if (article === 'die') return 'bg-[var(--die-bg)] text-[var(--die-text)]';
  return 'bg-[var(--das-bg)] text-[var(--das-text)]';
}

export function StoryShelf({
  stories,
  readStoryIds,
  loading,
  onSelectStory,
  onDeleteLocalStory,
  onShareLocalStory,
  onOpenGenerator,
}: StoryShelfProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [shareFeedbackId, setShareFeedbackId] = useState<string | null>(null);

  const handleShare = async (e: React.MouseEvent, entry: StoryIndexEntry) => {
    e.stopPropagation();
    await onShareLocalStory(entry);
    setShareFeedbackId(entry.id);
    setTimeout(() => setShareFeedbackId((curr) => (curr === entry.id ? null : curr)), 2000);
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      await onDeleteLocalStory(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3 animate-pulse"
          >
            <div className="aspect-[4/3] rounded-2xl bg-[var(--bg-elevated)] mb-3" />
            <div className="h-5 w-3/4 rounded bg-[var(--bg-elevated)] mb-2" />
            <div className="h-4 w-1/2 rounded bg-[var(--bg-elevated)]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Quick banner to invent a new story on the phone */}
      <button
        type="button"
        onClick={onOpenGenerator}
        className="w-full text-left rounded-3xl border-2 border-dashed border-[var(--accent)]/50 bg-[var(--accent-soft)]/60 p-4 flex items-center justify-between gap-3 active:scale-[0.99] transition-transform cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 rounded-2xl bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-extrabold text-base leading-tight">
              Neue Geschichte auf dem Handy erfinden
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Lieblingstier wählen &amp; sofort vorlesen
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--accent)] text-[var(--accent-text)] px-3 py-1.5 text-xs font-extrabold">
          Los!
        </span>
      </button>

      {stories.length === 0 ? (
        <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-8 text-center">
          <BookOpen className="h-10 w-10 mx-auto text-[var(--text-muted)] mb-2" />
          <p className="font-bold text-lg">Noch keine Geschichten</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Erstelle deine erste Tiergeschichte direkt oben!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stories.map((story) => {
            const isRead = readStoryIds.has(story.id);
            const isLocal = story.source === 'local';
            const isConfirming = confirmDeleteId === story.id;

            return (
              <article
                key={`${story.source}-${story.id}`}
                onClick={() => onSelectStory(story)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectStory(story);
                  }
                }}
                className="group relative flex flex-col rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm hover:shadow-md active:scale-[0.99] transition-all overflow-hidden cursor-pointer"
              >
                {/* Cover Art */}
                <div className="relative aspect-[4/3] w-full bg-[var(--bg-elevated)] overflow-hidden">
                  <SafeSvg
                    svg={story.coverSvg}
                    alt={story.title}
                    fallbackEmoji={story.animalEmoji || '🐾'}
                    className="h-full w-full"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-xs text-white px-2.5 py-1 text-xs font-bold">
                      <span>{story.animalEmoji || '🐾'}</span>
                      <span>{story.theme}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isLocal && (
                        <span className="rounded-full bg-[var(--accent)] text-[var(--accent-text)] px-2.5 py-1 text-[11px] font-extrabold shadow-xs">
                          Auf diesem Handy
                        </span>
                      )}
                      {isRead && (
                        <span
                          className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-600 text-white shadow-xs"
                          title="Gelesen"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Story Card Details */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h2 className="font-extrabold text-lg leading-snug text-[var(--text-main)]">
                      {story.title}
                    </h2>
                    <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
                      {story.titleEn} · {story.sceneCount} Szenen · 5 Fragen
                    </p>
                  </div>

                  {/* Vocab preview chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {story.vocabulary.slice(0, 4).map((v) => (
                      <span
                        key={`${v.article}-${v.word}`}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${articleClass(
                          v.article
                        )}`}
                      >
                        {v.emoji && <span>{v.emoji}</span>}
                        <span>
                          {v.article} {v.word}
                        </span>
                      </span>
                    ))}
                  </div>

                  {/* Local story actions: Share JSON to Dad + Delete */}
                  {isLocal && (
                    <div
                      className="pt-2 border-t border-[var(--border-soft)] flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleShare(e, story)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-bold text-[var(--text-main)] cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>
                          {shareFeedbackId === story.id ? 'Exportiert!' : 'Teilen / Export'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(e, story.id)}
                        onBlur={() => setConfirmDeleteId(null)}
                        className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer ${
                          isConfirming
                            ? 'bg-rose-600 text-white'
                            : 'text-rose-600 hover:bg-rose-500/10'
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{isConfirming ? 'Wirklich löschen?' : 'Löschen'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export type { Story };
