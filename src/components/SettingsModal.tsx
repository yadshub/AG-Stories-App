import { useRef, useState } from 'react';
import { Eye, EyeOff, KeyRound, Moon, Upload, X } from 'lucide-react';
import type { AppSettings, Story } from '../types/story';
import { DEFAULT_SETTINGS } from '../lib/storage';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (next: AppSettings) => void;
  onImportStory: (story: Story) => Promise<void>;
  onClose: () => void;
}

export function SettingsModal({
  settings,
  onSave,
  onImportStory,
  onClose,
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [model, setModel] = useState(settings.geminiModel);
  const [bedtimeMode, setBedtimeMode] = useState(settings.bedtimeMode);
  const [showKey, setShowKey] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      geminiApiKey: apiKey.trim(),
      geminiModel: model.trim() || DEFAULT_SETTINGS.geminiModel,
      bedtimeMode,
    });
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Story;
      if (!parsed.id || !parsed.title || !Array.isArray(parsed.scenes)) {
        throw new Error('Ungültige Geschichten-Datei.');
      }
      await onImportStory({
        ...parsed,
        source: 'local',
        createdAt: parsed.createdAt || new Date().toISOString(),
      });
      setImportMsg(`«${parsed.title}» wurde importiert!`);
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : 'Import fehlgeschlagen.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-5 pb-safe max-h-[90dvh] overflow-y-auto space-y-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Einstellungen</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schliessen"
            className="h-9 w-9 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <label className="text-sm font-extrabold flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-[var(--accent)]" />
              <span>Gemini API-Schlüssel (für neue Handy-Geschichten)</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                autoComplete="off"
                className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-page)] pl-3.5 pr-11 py-2.5 text-sm font-mono focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                aria-label="Schlüssel anzeigen"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-muted)] cursor-pointer"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Kostenlos erhältlich unter{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="underline font-bold text-[var(--accent)]"
              >
                aistudio.google.com/apikey
              </a>
              . Bleibt privat im Browser dieses Handys gespeichert.
            </p>
          </div>

          {/* Gemini Model */}
          <div className="space-y-1.5">
            <label className="text-sm font-extrabold block">Gemini Modell</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Bedtime Dim Mode */}
          <div className="flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-page)] p-3.5">
            <div className="flex items-center gap-2.5">
              <Moon className="h-5 w-5 text-[var(--accent)]" />
              <div>
                <p className="text-sm font-extrabold">Schlafenszeit-Modus</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Sanft abgedunkelt für abends im Bett
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={bedtimeMode}
              onChange={(e) => setBedtimeMode(e.target.checked)}
              className="h-5 w-5 accent-[var(--accent)] cursor-pointer"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-[var(--accent)] text-[var(--accent-text)] py-3.5 font-extrabold text-sm shadow-sm cursor-pointer"
          >
            Speichern
          </button>
        </form>

        {/* Optional JSON Import */}
        <div className="pt-3 border-t border-[var(--border-soft)] space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-elevated)] py-2.5 px-4 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Geschichten-Datei (.json) importieren</span>
          </button>
          {importMsg && (
            <p className="text-xs font-bold text-center text-[var(--accent)]">{importMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
}
