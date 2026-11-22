import type { GermanArticle, QuestionType, Story, StoryQuestion, StoryScene, VocabWord } from '../types/story';
import { sanitizeSvg } from './svgSanitizer';

export interface GenerateStoryRequest {
  animal: string;
  animalEmoji: string;
  theme: string;
  customIdea?: string;
  existingTitles: string[];
  apiKey: string;
  model: string;
}

const SYSTEM_INSTRUCTIONS = `Du bist ein liebevoller Schweizer Kinderbuchautor und Illustrator für einen 4-jährigen Buben im Schweizer Kindergarten.

STRENGE SPRACHREGELN (SCHWEIZER HOCHDEUTSCH):
- Schreibe IMMER in einfachem, warmem Schweizer Hochdeutsch (Niveau A1 für 4-Jährige).
- NIEMALS "ß" verwenden! Immer "ss" schreiben (z.B. gross, Strasse, weiss, heiss, draussen, Spass).
- Nutze natürliche Schweizer Kinderwörter wenn sie passen (z.B. Velo, Rüebli, Znüni, Glace, Rucksack, Kindergarten, Schlitten).
- Verwende einfaches Präsens (Gegenwart), kurze Sätze (1 bis 3 Sätze pro Szene), freundliche Wiederholungen und Tiergeräusche.
- Keine gruseligen oder traurigen Inhalte. Immer ein warmes, glückliches Ende.

STRUKTUR:
- Genau 6 oder 7 Szenen (scenes).
- 3 bis 4 Zielwörter (vocabulary) mit Artikel ("der", "die", "das"), englischer Übersetzung und passendem Emoji. Diese Zielwörter sollen klar in der Geschichte vorkommen und in highlightWords der jeweiligen Szene stehen.
- Genau 5 Verständnisfragen (questions) am Ende:
  - 3 Fragen vom Typ "recall" (einfache Erinnerungsfragen zur Geschichte)
  - 1 Frage vom Typ "vocab" (fragt nach einem der Zielwörter mit Artikel)
  - 1 Frage vom Typ "open" (spielerische Fantasiefrage: "Was würdest du...?")
- Jede Szene und jede Frage/Antwort hat eine klare englische Übersetzung für nicht-deutschsprachige Eltern.

ILLUSTRATIONEN (SVG STYLE SPEC):
- Jede Szene UND das Cover brauchen ein eigenes, liebevolles Flat-Vector-SVG (Bilderbuch-Stil wie Eric Carle / modernes Kinderbuch).
- Immer viewBox="0 0 400 300" verwenden.
- Warme Pastellfarben (Himmel #D9F0FF oder #FFE8D6, Wiese #A8D89A, Sonne #FFD166, weiche runde Formen).
- Die Hauptfigur (das Tier) muss in ALLEN Szenen konsistent aussehen (gleiche Farbe, Ohren, Augen, rosige Wangen, lächelnder Mund) aber in jeder Szene eine andere Pose oder Umgebung zeigen, die direkt zum Text passt!
- Halte jedes SVG sauber und kompakt (ca. 12–28 SVG-Elemente: rect, circle, ellipse, path, polygon). Keine <script>, keine externen Links, keine komplizierten Filter.`;

function buildUserPrompt(req: GenerateStoryRequest): string {
  const avoidList =
    req.existingTitles.length > 0
      ? `\nBereits vorhandene Geschichten (erfinde eine NEUE Handlung): ${req.existingTitles.slice(0, 12).join(', ')}`
      : '';

  const customLine = req.customIdea?.trim()
    ? `\nBesonderer Wunsch vom Kind: ${req.customIdea.trim()}`
    : '';

  return `Erstelle eine neue Schweizer Hochdeutsch Bildergeschichte als reines JSON-Objekt.

Hauptfigur (Tier): ${req.animal}
Thema / Ort: ${req.theme}${customLine}${avoidList}

Gib AUSSCHLIESSLICH gültiges JSON mit exakt dieser Struktur zurück:
{
  "title": "Kurzer deutscher Titel ohne ß",
  "titleEn": "Short English title",
  "animal": "${req.animal}",
  "animalEmoji": "${req.animalEmoji}",
  "theme": "${req.theme}",
  "coverSvg": "<svg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'>...</svg>",
  "vocabulary": [
    { "article": "der|die|das", "word": "Wort", "translationEn": "English", "emoji": "🚲" }
  ],
  "scenes": [
    {
      "index": 1,
      "textDe": "1-3 einfache Schweizer Hochdeutsch Sätze im Präsens.",
      "textEn": "Simple English translation for parents.",
      "highlightWords": ["Wort"],
      "svg": "<svg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'>...</svg>"
    }
  ],
  "questions": [
    {
      "type": "recall|vocab|open",
      "questionDe": "Einfache deutsche Frage?",
      "questionEn": "English translation of question?",
      "answerDe": "Kurze deutsche Beispielantwort.",
      "answerEn": "English translation of answer."
    }
  ]
}`;
}

function replaceEszett(text: string): string {
  return text.replace(/ß/g, 'ss');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42);
}

function extractJsonObject(rawText: string): unknown {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('Antwort war kein gültiges JSON.');
  }
}

function normalizeArticle(article: unknown): GermanArticle {
  const val = String(article || '').toLowerCase().trim();
  if (val === 'der' || val === 'die' || val === 'das') return val;
  return 'das';
}

function normalizeQuestionType(type: unknown, index: number): QuestionType {
  const val = String(type || '').toLowerCase().trim();
  if (val === 'recall' || val === 'vocab' || val === 'open') return val;
  if (index === 3) return 'vocab';
  if (index === 4) return 'open';
  return 'recall';
}

export async function generateStoryWithGemini(req: GenerateStoryRequest): Promise<Story> {
  const apiKey = req.apiKey.trim();
  if (!apiKey) {
    throw new Error('Bitte hinterlege zuerst deinen kostenlosen Gemini API-Schlüssel in den Einstellungen.');
  }

  const model = req.model.trim() || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTIONS }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: buildUserPrompt(req) }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.85,
        maxOutputTokens: 16384,
      },
    }),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const errJson = await response.json();
      detail = errJson?.error?.message || '';
    } catch {
      // ignore
    }
    if (response.status === 400 || response.status === 403) {
      throw new Error(
        `API-Schlüssel ungültig oder nicht berechtigt (${response.status}). ${detail}`.trim()
      );
    }
    if (response.status === 429) {
      throw new Error('Kostenloses Gemini-Limit kurzzeitig erreicht. Bitte in 1 Minute nochmals versuchen.');
    }
    throw new Error(`Gemini Fehler (${response.status}): ${detail || 'Bitte nochmals versuchen.'}`);
  }

  const data = await response.json();
  const rawText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini hat eine leere Antwort zurückgegeben. Bitte nochmals versuchen.');
  }

  const parsed = extractJsonObject(rawText) as Record<string, unknown>;

  const title = replaceEszett(String(parsed.title || `${req.animal} erlebt ein Abenteuer`)).trim();
  const titleEn = String(parsed.titleEn || `${req.animal}'s Adventure`).trim();

  const rawVocab = Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [];
  const vocabulary: VocabWord[] = rawVocab
    .slice(0, 6)
    .map((item) => {
      const v = item as Record<string, unknown>;
      return {
        article: normalizeArticle(v.article),
        word: replaceEszett(String(v.word || '')).trim(),
        translationEn: String(v.translationEn || '').trim(),
        emoji: String(v.emoji || '✨').trim(),
      };
    })
    .filter((v) => v.word && v.translationEn);

  const rawScenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
  if (rawScenes.length < 3) {
    throw new Error('Die generierte Geschichte hatte zu wenige Szenen. Bitte nochmals versuchen.');
  }

  const scenes: StoryScene[] = rawScenes.slice(0, 8).map((item, idx) => {
    const s = item as Record<string, unknown>;
    const sanitized = sanitizeSvg(String(s.svg || ''));
    return {
      index: idx + 1,
      textDe: replaceEszett(String(s.textDe || '')).trim(),
      textEn: String(s.textEn || '').trim(),
      highlightWords: Array.isArray(s.highlightWords)
        ? s.highlightWords.map((w) => replaceEszett(String(w)).trim()).filter(Boolean)
        : [],
      svg: sanitized || '',
    };
  });

  const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
  const questions: StoryQuestion[] = rawQuestions.slice(0, 5).map((item, idx) => {
    const q = item as Record<string, unknown>;
    return {
      type: normalizeQuestionType(q.type, idx),
      questionDe: replaceEszett(String(q.questionDe || '')).trim(),
      questionEn: String(q.questionEn || '').trim(),
      answerDe: replaceEszett(String(q.answerDe || '')).trim(),
      answerEn: String(q.answerEn || '').trim(),
    };
  });

  const coverSvg = sanitizeSvg(String(parsed.coverSvg || '')) || scenes[0]?.svg || '';
  const timestamp = new Date().toISOString();
  const shortStamp = Date.now().toString(36).slice(-4);

  return {
    id: `${slugify(title) || 'geschichte'}-${shortStamp}`,
    title,
    titleEn,
    animal: replaceEszett(String(parsed.animal || req.animal)).trim(),
    animalEmoji: String(parsed.animalEmoji || req.animalEmoji || '🐾').trim(),
    theme: replaceEszett(String(parsed.theme || req.theme)).trim(),
    createdAt: timestamp,
    source: 'local',
    coverSvg,
    vocabulary,
    scenes,
    questions,
  };
}
