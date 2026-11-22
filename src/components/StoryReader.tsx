import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Languages, Moon, Sparkles, Sun, X } from 'lucide-react';
import type { Story, VocabWord } from '../types/story';
import { SafeSvg } from './SafeSvg';
import { QuizCards } from './QuizCards';

interface StoryReaderProps {
  story: Story;
  bedtimeMode: boolean;
  starredVocab: Set<string>;
  onToggleBedtime: () => void;
  onToggleVocabStar: (word: VocabWord) => void;
  onCompleteStory: (storyId: string) => void;
  onClose: () => void;
}

function articleChipClasses(article: string): string {
  if (article === 'der') {
    return 'bg-[var(--der-bg)] text-[var(--der-text)] border-[var(--der-border)]';
  }
  if (article === 'die') {
    return 'bg-[var(--die-bg)] text-[var(--die-text)] border-[var(--die-border)]';
  }
  return 'bg-[var(--das-bg)] text-[var(--das-text)] border-[var(--das-border)]';
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function StoryReader({
  story,
  bedtimeMode,
  starredVocab,
  onToggleBedtime,
  onToggleVocabStar,
  onCompleteStory,
  onClose,
}: StoryReaderProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [inQuiz, setInQuiz] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [activeVocab, setActiveVocab] = useState<VocabWord | null>(null);
  const touchStartX = useRef<number | null>(null);

  const totalScenes = story.scenes.length;
  const scene = story.scenes[sceneIndex];

  // Map vocabulary words (case-insensitive) for inline highlighting
  const vocabLookup = useMemo(() => {
    const map = new Map<string, VocabWord>();
    for (const v of story.vocabulary) {
      map.set(v.word.toLowerCase(), v);
    }
    return map;
  }, [story.vocabulary]);

  const renderedTextSegments = useMemo(() => {
    if (!scene) return [];
    const wordsToHighlight = Array.from(
      new Set([
        ...story.vocabulary.map((v) => v.word),
        ...(scene.highlightWords || []),
      ])
    )
      .filter((w) => w.trim().length > 1)
      .sort((a, b) => b.length - a.length);

    if (wordsToHighlight.length === 0) {
      return [{ text: scene.textDe, vocab: undefined as VocabWord | undefined }];
    }

    const pattern = new RegExp(`(${wordsToHighlight.map(escapeRegExp).join('|')})`, 'gi');
    const parts = scene.textDe.split(pattern);

    return parts.map((part) => {
      const matched = vocabLookup.get(part.toLowerCase());
      return { text: part, vocab: matched };
    });
  }, [scene, story.vocabulary, vocabLookup]);

  const goPrev = () => {
    setActiveVocab(null);
    if (sceneIndex > 0) {
      setSceneIndex((i) => i - 1);
    }
  };

  const goNext = () => {
    setActiveVocab(null);
    if (sceneIndex < totalScenes - 1) {
      setSceneIndex((i) => i + 1);
    } else {
      onCompleteStory(story.id);
      setInQuiz(true);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    if (delta < 0) goNext();
    if (delta > 0) goPrev();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-page)] text-[var(--text-main)] h-[100dvh]">
      {/* Reader Top Bar */}
      <header className="pt-safe px-3 pb-2 flex items-center justify-between gap-2 border-b border-[var(--border-soft)] bg-[var(--bg-card)]/90 backdrop-blur-xs">
        <button
          type="button"
          onClick={onClose}
          aria-label="Schliessen"
          className="h-10 w-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center shrink-0 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="min-w-0 text-center flex-1">
          <h1 className="font-extrabold text-sm sm:text-base truncate">{story.title}</h1>
          <p className="text-[11px] font-bold text-[var(--text-muted)]">
            {inQuiz
              ? `5 Fragen · ${story.animalEmoji || '🐾'} ${story.animal}`
              : `Szene ${sceneIndex + 1} von ${totalScenes}`}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleBedtime}
          aria-label="Schlafenszeit-Modus umschalten"
          className="h-10 w-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center shrink-0 cursor-pointer"
        >
          {bedtimeMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      {inQuiz ? (
        <QuizCards
          story={story}
          starredVocab={starredVocab}
          onToggleVocabStar={onToggleVocabStar}
          onBackToStory={() => setInQuiz(false)}
          onFinish={onClose}
          onReadAgain={() => {
            setInQuiz(false);
            setSceneIndex(0);
            setActiveVocab(null);
          }}
        />
      ) : (
        <div
          className="flex-1 flex flex-col min-h-0 select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Scene Progress Dots */}
          <div className="px-4 pt-2.5 pb-1 flex items-center gap-1.5 max-w-4xl mx-auto w-full">
            {story.scenes.map((s, idx) => (
              <button
                key={s.index}
                type="button"
                aria-label={`Szene ${idx + 1}`}
                onClick={() => {
                  setSceneIndex(idx);
                  setActiveVocab(null);
                }}
                className={`h-2 flex-1 rounded-full transition-all cursor-pointer ${
                  idx === sceneIndex
                    ? 'bg-[var(--accent)]'
                    : idx < sceneIndex
                      ? 'bg-[var(--accent)]/45'
                      : 'bg-[var(--bg-subtle)]'
                }`}
              />
            ))}
            <button
              type="button"
              aria-label="5 Fragen"
              onClick={() => {
                onCompleteStory(story.id);
                setInQuiz(true);
              }}
              className="h-5 px-2 rounded-full bg-[var(--bg-elevated)] text-[10px] font-extrabold text-[var(--text-muted)] flex items-center gap-0.5 shrink-0 cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-[var(--accent)]" />
              <span>5</span>
            </button>
          </div>

          {/* Portrait-first Stacked / Landscape Side-by-Side Story Area */}
          <div className="flex-1 min-h-0 grid grid-cols-1 grid-rows-[minmax(0,1.15fr)_minmax(0,1fr)] md:grid-cols-2 md:grid-rows-1 gap-3 px-4 py-2 max-w-5xl mx-auto w-full overflow-hidden">
            {/* Illustration Stage (top ~53% in portrait, left 50% on desktop/landscape) */}
            <div className="min-w-0 min-h-0 flex items-center justify-center">
              <div className="w-full h-full max-w-[560px] max-h-[420px] rounded-3xl border-2 border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm overflow-hidden flex items-center justify-center p-1">
                <SafeSvg
                  svg={scene.svg}
                  imageUrl={scene.imageUrl}
                  alt={`Szene ${scene.index}: ${story.title}`}
                  fallbackEmoji={story.animalEmoji || '🐾'}
                  className="w-full h-full rounded-2xl"
                />
              </div>
            </div>

            {/* Text & Parent Helper Panel (bottom ~47% in portrait, right 50% on desktop/landscape) */}
            <div className="min-w-0 min-h-0 flex flex-col justify-between rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 sm:p-6 overflow-y-auto">
              <div className="space-y-3">
                {/* Large German Story Text with Interactive Vocab Highlights */}
                <p className="text-xl sm:text-2xl md:text-[26px] font-extrabold leading-relaxed tracking-normal text-[var(--text-main)]">
                  {renderedTextSegments.map((seg, idx) =>
                    seg.vocab ? (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setActiveVocab((curr) =>
                            curr?.word === seg.vocab?.word ? null : seg.vocab || null
                          )
                        }
                        className={`inline rounded-xl border px-1.5 py-0.5 mx-0.5 align-baseline font-black transition-transform active:scale-95 cursor-pointer ${articleChipClasses(
                          seg.vocab.article
                        )}`}
                      >
                        {seg.text}
                      </button>
                    ) : (
                      <span key={idx}>{seg.text}</span>
                    )
                  )}
                </p>

                {/* Active tapped word popup */}
                {activeVocab && (
                  <div
                    className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-extrabold ${articleChipClasses(
                      activeVocab.article
                    )}`}
                  >
                    <span className="text-lg">{activeVocab.emoji || '✨'}</span>
                    <span>
                      {activeVocab.article} {activeVocab.word}
                    </span>
                    <span className="opacity-75 font-bold">= {activeVocab.translationEn}</span>
                  </div>
                )}

                {/* Discreet English Parent Translation */}
                {showEnglish && (
                  <p className="text-sm sm:text-base font-semibold text-[var(--text-muted)] italic border-l-3 border-[var(--accent)]/50 pl-3 py-0.5">
                    {scene.textEn}
                  </p>
                )}
              </div>

              {/* Bottom bar inside reading card: EN toggle */}
              <div className="pt-3 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[var(--text-muted)]">
                  Tippe farbige Wörter für Übersetzung
                </span>
                <button
                  type="button"
                  onClick={() => setShowEnglish((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition-colors cursor-pointer shrink-0 ${
                    showEnglish
                      ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                  }`}
                >
                  <Languages className="h-3.5 w-3.5" />
                  <span>{showEnglish ? 'EN aus' : 'EN'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Prev / Next Controls */}
          <footer className="px-4 pt-2 pb-safe flex items-center justify-between gap-3 max-w-5xl mx-auto w-full">
            <button
              type="button"
              onClick={goPrev}
              disabled={sceneIndex === 0}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3.5 text-sm font-extrabold disabled:opacity-35 cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Zurück</span>
            </button>

            <button
              type="button"
              onClick={goNext}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--accent)] text-[var(--accent-text)] px-5 py-3.5 text-base font-extrabold shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
            >
              <span>
                {sceneIndex < totalScenes - 1 ? 'Weiter' : '5 Fragen starten ✨'}
              </span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}
