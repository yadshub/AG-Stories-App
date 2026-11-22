import { useState } from 'react';
import { AlertCircle, KeyRound, Loader2, Sparkles, Wand2 } from 'lucide-react';
import type { AppSettings, Story } from '../types/story';
import { generateStoryWithGemini } from '../lib/geminiGenerator';

interface StoryGeneratorProps {
  settings: AppSettings;
  existingTitles: string[];
  onStoryCreated: (story: Story) => Promise<void>;
  onOpenSettings: () => void;
}

const ANIMAL_CHOICES = [
  { name: 'Bär', emoji: '🐻' },
  { name: 'Fuchs', emoji: '🦊' },
  { name: 'Hase', emoji: '🐰' },
  { name: 'Ente', emoji: '🦆' },
  { name: 'Eule', emoji: '🦉' },
  { name: 'Elefant', emoji: '🐘' },
  { name: 'Igel', emoji: '🦔' },
  { name: 'Hund', emoji: '🐶' },
  { name: 'Pinguin', emoji: '🐧' },
];

const THEME_CHOICES = [
  { name: 'Kindergarten', emoji: '🏫' },
  { name: 'Wald', emoji: '🌲' },
  { name: 'Schnee', emoji: '❄️' },
  { name: 'Spielplatz', emoji: '🛝' },
  { name: 'Znüni', emoji: '🍎' },
  { name: 'Schlafenszeit', emoji: '🌙' },
  { name: 'Regenwetter', emoji: '☔' },
  { name: 'Bauernhof', emoji: '🚜' },
];

export function StoryGenerator({
  settings,
  existingTitles,
  onStoryCreated,
  onOpenSettings,
}: StoryGeneratorProps) {
  const [selectedAnimal, setSelectedAnimal] = useState(ANIMAL_CHOICES[0]);
  const [customAnimal, setCustomAnimal] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(THEME_CHOICES[0]);
  const [customIdea, setCustomIdea] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasApiKey = settings.geminiApiKey.trim().length > 0;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasApiKey) {
      onOpenSettings();
      return;
    }

    const animalName = customAnimal.trim() || selectedAnimal.name;
    const animalEmoji = customAnimal.trim() ? '🐾' : selectedAnimal.emoji;

    setGenerating(true);
    try {
      const story = await generateStoryWithGemini({
        animal: animalName,
        animalEmoji,
        theme: selectedTheme.name,
        customIdea: customIdea.trim() || undefined,
        existingTitles,
        apiKey: settings.geminiApiKey,
        model: settings.geminiModel,
      });
      await onStoryCreated(story);
      setCustomIdea('');
      setCustomAnimal('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Erstellen.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Setup Banner if Gemini API key not entered yet */}
      {!hasApiKey && (
        <div className="rounded-3xl border-2 border-amber-400/60 bg-amber-400/15 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <KeyRound className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-extrabold">Einmalig kostenlosen Gemini-Schlüssel eintragen</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Der Schlüssel bleibt sicher nur auf diesem Handy gespeichert (0 Fr./Monat im Google
                AI Studio Free Tier).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="shrink-0 rounded-2xl bg-[var(--accent)] text-[var(--accent-text)] px-4 py-2 text-xs font-extrabold cursor-pointer"
          >
            Einstellungen öffnen
          </button>
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-5">
        {/* Step 1: Animal Picker */}
        <section className="rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 sm:p-5 space-y-3">
          <h2 className="text-lg font-black">1. Welches Tier spielt die Hauptrolle?</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
            {ANIMAL_CHOICES.map((animal) => {
              const active = !customAnimal.trim() && selectedAnimal.name === animal.name;
              return (
                <button
                  key={animal.name}
                  type="button"
                  disabled={generating}
                  onClick={() => {
                    setSelectedAnimal(animal);
                    setCustomAnimal('');
                  }}
                  className={`rounded-2xl border-2 p-3 flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-xs'
                      : 'border-[var(--border-soft)] bg-[var(--bg-page)]'
                  }`}
                >
                  <span className="text-3xl">{animal.emoji}</span>
                  <span className="text-xs font-extrabold">{animal.name}</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={customAnimal}
            disabled={generating}
            onChange={(e) => setCustomAnimal(e.target.value)}
            placeholder="Oder ein anderes Tier eintippen (z.B. Murmeltier, Löwe, Katze)..."
            className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-3.5 py-2.5 text-sm font-semibold placeholder:text-[var(--text-muted)]/70 focus:outline-none focus:border-[var(--accent)]"
          />
        </section>

        {/* Step 2: Theme Picker */}
        <section className="rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 sm:p-5 space-y-3">
          <h2 className="text-lg font-black">2. Wo spielt die Geschichte?</h2>
          <div className="flex flex-wrap gap-2">
            {THEME_CHOICES.map((theme) => {
              const active = selectedTheme.name === theme.name;
              return (
                <button
                  key={theme.name}
                  type="button"
                  disabled={generating}
                  onClick={() => setSelectedTheme(theme)}
                  className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-extrabold transition-all active:scale-95 cursor-pointer ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border-soft)] bg-[var(--bg-page)]'
                  }`}
                >
                  <span>{theme.emoji}</span>
                  <span>{theme.name}</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={customIdea}
            disabled={generating}
            onChange={(e) => setCustomIdea(e.target.value)}
            placeholder="Optionaler Wunsch (z.B. fährt mit dem roten Tram, findet ein Glace)..."
            className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-3.5 py-2.5 text-sm font-semibold placeholder:text-[var(--text-muted)]/70 focus:outline-none focus:border-[var(--accent)]"
          />
        </section>

        {/* Error feedback */}
        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-start gap-2.5 text-sm font-bold text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit / Loading State */}
        {generating ? (
          <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 text-center space-y-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <p className="font-black text-lg">
              {customAnimal.trim() || selectedAnimal.name} erlebt gerade ein Abenteuer…
            </p>
            <p className="text-xs font-semibold text-[var(--text-muted)]">
              Text in Schweizer Hochdeutsch, Bilder &amp; 5 Fragen werden gezeichnet (ca. 10–15
              Sekunden).
            </p>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full rounded-3xl bg-[var(--accent)] text-[var(--accent-text)] py-4 px-6 font-black text-base shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-transform cursor-pointer"
          >
            <Wand2 className="h-5 w-5" />
            <span>
              Geschichte erfinden ({customAnimal.trim() || selectedAnimal.name} ·{' '}
              {selectedTheme.name})
            </span>
            <Sparkles className="h-5 w-5" />
          </button>
        )}
      </form>
    </div>
  );
}
