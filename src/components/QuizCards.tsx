import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Languages, RotateCcw, Star, Trophy } from 'lucide-react';
import type { Story, VocabWord } from '../types/story';
import { vocabKey } from '../lib/storage';

interface QuizCardsProps {
  story: Story;
  starredVocab: Set<string>;
  onToggleVocabStar: (word: VocabWord) => void;
  onBackToStory: () => void;
  onFinish: () => void;
  onReadAgain: () => void;
}

function typeBadge(type: string): { label: string; emoji: string; cls: string } {
  if (type === 'vocab') {
    return {
      label: 'Wortschatz',
      emoji: '📚',
      cls: 'bg-[var(--das-bg)] text-[var(--das-text)]',
    };
  }
  if (type === 'open') {
    return {
      label: 'Fantasie',
      emoji: '✨',
      cls: 'bg-[var(--die-bg)] text-[var(--die-text)]',
    };
  }
  return {
    label: 'Erinnern',
    emoji: '🔍',
    cls: 'bg-[var(--der-bg)] text-[var(--der-text)]',
  };
}

function articlePillStyle(article: string): string {
  if (article === 'der') return 'bg-[var(--der-bg)] text-[var(--der-text)] border-[var(--der-border)]';
  if (article === 'die') return 'bg-[var(--die-bg)] text-[var(--die-text)] border-[var(--die-border)]';
  return 'bg-[var(--das-bg)] text-[var(--das-text)] border-[var(--das-border)]';
}

export function QuizCards({
  story,
  starredVocab,
  onToggleVocabStar,
  onBackToStory,
  onFinish,
  onReadAgain,
}: QuizCardsProps) {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [completed, setCompleted] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const questions = story.questions;
  const total = questions.length;
  const current = questions[index];

  const goPrev = () => {
    setShowAnswer(false);
    if (completed) {
      setCompleted(false);
      return;
    }
    if (index === 0) {
      onBackToStory();
    } else {
      setIndex((i) => i - 1);
    }
  };

  const goNext = () => {
    setShowAnswer(false);
    if (index < total - 1) {
      setIndex((i) => i + 1);
    } else {
      setCompleted(true);
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
    if (delta < 0 && !completed) goNext();
    if (delta > 0) goPrev();
  };

  if (completed || total === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-between px-5 py-6 max-w-xl mx-auto w-full overflow-y-auto">
        <div className="w-full text-center space-y-3 mt-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/25 text-amber-500">
            <Trophy className="h-9 w-9" />
          </div>
          <h2 className="text-2xl font-black">Super gemacht! 🎉</h2>
          <p className="text-sm font-semibold text-[var(--text-muted)]">
            Ihr habt &laquo;{story.title}&raquo; und alle {total} Fragen geschafft!
          </p>
        </div>

        {/* Story Vocabulary Recap */}
        <div className="w-full rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 my-5 space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--text-muted)]">
            Wörter aus dieser Geschichte (Tippen = geübt ⭐)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {story.vocabulary.map((word) => {
              const key = vocabKey(word.article, word.word);
              const isStarred = starredVocab.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleVocabStar(word)}
                  className={`flex items-center justify-between gap-2 rounded-2xl border p-3 text-left transition-transform active:scale-[0.98] cursor-pointer ${articlePillStyle(
                    word.article
                  )}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl shrink-0">{word.emoji || '✨'}</span>
                    <div className="min-w-0">
                      <p className="font-extrabold text-base leading-tight truncate">
                        {word.article} {word.word}
                      </p>
                      <p className="text-xs opacity-80 truncate">{word.translationEn}</p>
                    </div>
                  </div>
                  <Star
                    className={`h-5 w-5 shrink-0 ${
                      isStarred ? 'fill-amber-400 text-amber-500' : 'opacity-40'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full flex gap-3 pb-safe">
          <button
            type="button"
            onClick={onReadAgain}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] py-3.5 font-extrabold text-sm cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Nochmal lesen</span>
          </button>
          <button
            type="button"
            onClick={onFinish}
            className="flex-1 rounded-2xl bg-[var(--accent)] text-[var(--accent-text)] py-3.5 font-extrabold text-sm shadow-sm cursor-pointer"
          >
            Zum Bücherregal
          </button>
        </div>
      </div>
    );
  }

  const badge = typeBadge(current.type);

  return (
    <div
      className="flex-1 flex flex-col justify-between px-4 py-4 max-w-xl mx-auto w-full select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Question Counter + Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${badge.cls}`}
          >
            <span>{badge.emoji}</span>
            <span>{badge.label}</span>
          </span>
          <span className="text-xs font-extrabold text-[var(--text-muted)]">
            Frage {index + 1} von {total}
          </span>
        </div>

        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= index ? 'bg-[var(--accent)]' : 'bg-[var(--bg-subtle)]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Q&A Card */}
      <div className="my-4 flex-1 flex flex-col justify-center">
        <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm p-6 space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              Frage an dein Kind
            </p>
            <h3 className="text-2xl sm:text-3xl font-black leading-snug text-[var(--text-main)]">
              {current.questionDe}
            </h3>
            {showEnglish && (
              <p className="text-sm font-semibold text-[var(--text-muted)] italic pt-1">
                🇬🇧 {current.questionEn}
              </p>
            )}
          </div>

          {/* Answer Box */}
          <div className="pt-2">
            {showAnswer ? (
              <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-soft)] p-4 space-y-1.5">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--accent)]">
                  Beispielantwort
                </p>
                <p className="text-lg font-extrabold text-[var(--text-main)] leading-snug">
                  {current.answerDe}
                </p>
                {showEnglish && (
                  <p className="text-sm font-semibold text-[var(--text-muted)] italic">
                    🇬🇧 {current.answerEn}
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAnswer(true)}
                className="w-full rounded-2xl border-2 border-dashed border-[var(--border-soft)] bg-[var(--bg-elevated)]/60 py-5 px-4 flex items-center justify-center gap-2 text-sm font-extrabold text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-[0.99] transition-all cursor-pointer"
              >
                <Eye className="h-4 w-4" />
                <span>Antwort anzeigen</span>
              </button>
            )}
          </div>

          {/* Controls inside card */}
          <div className="flex items-center justify-between pt-1">
            {showAnswer ? (
              <button
                type="button"
                onClick={() => setShowAnswer(false)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] cursor-pointer"
              >
                <EyeOff className="h-3.5 w-3.5" />
                <span>Antwort verbergen</span>
              </button>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={() => setShowEnglish((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition-colors cursor-pointer ${
                showEnglish
                  ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
              }`}
            >
              <Languages className="h-3.5 w-3.5" />
              <span>EN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-3 pb-safe">
        <button
          type="button"
          onClick={goPrev}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3.5 text-sm font-extrabold cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{index === 0 ? 'Geschichte' : 'Zurück'}</span>
        </button>

        <button
          type="button"
          onClick={goNext}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--accent)] text-[var(--accent-text)] px-5 py-3.5 text-sm font-extrabold shadow-sm cursor-pointer"
        >
          <span>{index < total - 1 ? 'Nächste Frage' : 'Fertig! 🎉'}</span>
          {index < total - 1 && <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
