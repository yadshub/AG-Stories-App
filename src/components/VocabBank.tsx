import { useMemo, useState } from 'react';
import { BookMarked, Star } from 'lucide-react';
import type { GermanArticle, StoryIndexEntry, VocabWord } from '../types/story';
import { vocabKey } from '../lib/storage';

interface VocabBankProps {
  stories: StoryIndexEntry[];
  starredVocab: Set<string>;
  onToggleStar: (word: VocabWord) => void;
}

type FilterOption = 'all' | GermanArticle | 'starred';

interface AggregatedWord extends VocabWord {
  key: string;
  storyTitles: string[];
}

function cardStyle(article: GermanArticle): string {
  if (article === 'der') return 'bg-[var(--der-bg)] text-[var(--der-text)] border-[var(--der-border)]';
  if (article === 'die') return 'bg-[var(--die-bg)] text-[var(--die-text)] border-[var(--die-border)]';
  return 'bg-[var(--das-bg)] text-[var(--das-text)] border-[var(--das-border)]';
}

export function VocabBank({ stories, starredVocab, onToggleStar }: VocabBankProps) {
  const [filter, setFilter] = useState<FilterOption>('all');

  const allWords = useMemo(() => {
    const map = new Map<string, AggregatedWord>();
    for (const story of stories) {
      for (const word of story.vocabulary) {
        const key = vocabKey(word.article, word.word);
        const existing = map.get(key);
        if (existing) {
          if (!existing.storyTitles.includes(story.title)) {
            existing.storyTitles.push(story.title);
          }
        } else {
          map.set(key, {
            ...word,
            key,
            storyTitles: [story.title],
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.word.localeCompare(b.word, 'de-CH'));
  }, [stories]);

  const filteredWords = useMemo(() => {
    if (filter === 'all') return allWords;
    if (filter === 'starred') return allWords.filter((w) => starredVocab.has(w.key));
    return allWords.filter((w) => w.article === filter);
  }, [allWords, filter, starredVocab]);

  const starredCount = useMemo(
    () => allWords.filter((w) => starredVocab.has(w.key)).length,
    [allWords, starredVocab]
  );

  return (
    <div className="space-y-4">
      {/* Header Summary + Article Color Legend */}
      <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black">Wortschatz</h2>
            <p className="text-xs font-semibold text-[var(--text-muted)]">
              {allWords.length} Wörter gesammelt · {starredCount} ⭐ geübt
            </p>
          </div>
          <BookMarked className="h-7 w-7 text-[var(--accent)]" />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold cursor-pointer transition-colors ${
              filter === 'all'
                ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-main)]'
            }`}
          >
            Alle ({allWords.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('der')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold border cursor-pointer ${
              filter === 'der'
                ? 'ring-2 ring-blue-500 bg-[var(--der-bg)] text-[var(--der-text)] border-[var(--der-border)]'
                : 'bg-[var(--der-bg)]/70 text-[var(--der-text)] border-transparent'
            }`}
          >
            der (blau)
          </button>
          <button
            type="button"
            onClick={() => setFilter('die')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold border cursor-pointer ${
              filter === 'die'
                ? 'ring-2 ring-rose-500 bg-[var(--die-bg)] text-[var(--die-text)] border-[var(--die-border)]'
                : 'bg-[var(--die-bg)]/70 text-[var(--die-text)] border-transparent'
            }`}
          >
            die (rot)
          </button>
          <button
            type="button"
            onClick={() => setFilter('das')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold border cursor-pointer ${
              filter === 'das'
                ? 'ring-2 ring-emerald-500 bg-[var(--das-bg)] text-[var(--das-text)] border-[var(--das-border)]'
                : 'bg-[var(--das-bg)]/70 text-[var(--das-text)] border-transparent'
            }`}
          >
            das (grün)
          </button>
          <button
            type="button"
            onClick={() => setFilter('starred')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold cursor-pointer ${
              filter === 'starred'
                ? 'bg-amber-400 text-stone-900'
                : 'bg-[var(--bg-elevated)] text-[var(--text-main)]'
            }`}
          >
            ⭐ Geübt ({starredCount})
          </button>
        </div>
      </div>

      {/* Word Cards */}
      {filteredWords.length === 0 ? (
        <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-8 text-center">
          <p className="font-extrabold text-base">Keine Wörter in dieser Auswahl</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Tippe auf den Stern ⭐ bei einem Wort, wenn ihr es zusammen geübt habt.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredWords.map((word) => {
            const isStarred = starredVocab.has(word.key);
            return (
              <button
                key={word.key}
                type="button"
                onClick={() => onToggleStar(word)}
                className={`rounded-2xl border p-4 text-left flex items-start justify-between gap-3 transition-transform active:scale-[0.98] cursor-pointer ${cardStyle(
                  word.article
                )}`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-3xl leading-none mt-0.5 shrink-0">
                    {word.emoji || '✨'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-black leading-tight">
                      <span className="opacity-75 font-bold mr-1">{word.article}</span>
                      <span>{word.word}</span>
                    </p>
                    <p className="text-sm font-bold opacity-85 mt-0.5">{word.translationEn}</p>
                    <p className="text-[11px] font-semibold opacity-70 mt-1.5 truncate">
                      aus: {word.storyTitles[0]}
                    </p>
                  </div>
                </div>

                <Star
                  className={`h-5 w-5 shrink-0 mt-0.5 ${
                    isStarred ? 'fill-amber-400 text-amber-500' : 'opacity-35'
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
