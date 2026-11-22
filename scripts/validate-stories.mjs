import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORIES_DIR = path.resolve(__dirname, '../public/stories');
const INDEX_PATH = path.join(STORIES_DIR, 'index.json');

const VALID_ARTICLES = new Set(['der', 'die', 'das']);
const VALID_Q_TYPES = new Set(['recall', 'vocab', 'open']);

function hasEszett(value) {
  return typeof value === 'string' && value.includes('ß');
}

function validateSvgString(svg, label, errors) {
  if (typeof svg !== 'string' || !svg.trim()) {
    errors.push(`${label}: missing or empty SVG string`);
    return;
  }
  const trimmed = svg.trim();
  if (!trimmed.startsWith('<svg') || !trimmed.endsWith('</svg>')) {
    errors.push(`${label}: SVG must start with <svg and end with </svg>`);
  }
  if (/<script[\s>]/i.test(trimmed) || /\son\w+\s*=/i.test(trimmed)) {
    errors.push(`${label}: SVG contains forbidden script or event handler`);
  }
  if (!/viewBox\s*=\s*["'][^"']+["']/i.test(trimmed)) {
    errors.push(`${label}: SVG should specify a viewBox attribute`);
  }
}

function checkNoEszettInStory(story, errors) {
  const fields = [
    ['title', story.title],
    ['animal', story.animal],
    ['theme', story.theme],
  ];
  for (const [name, val] of fields) {
    if (hasEszett(val)) {
      errors.push(`${name}: contains 'ß' — use Swiss Hochdeutsch 'ss' instead`);
    }
  }
  (story.vocabulary || []).forEach((v, i) => {
    if (hasEszett(v.word)) {
      errors.push(`vocabulary[${i}].word ("${v.word}"): contains 'ß' — use 'ss'`);
    }
  });
  (story.scenes || []).forEach((s, i) => {
    if (hasEszett(s.textDe)) {
      errors.push(`scenes[${i}].textDe: contains 'ß' — use 'ss'`);
    }
  });
  (story.questions || []).forEach((q, i) => {
    if (hasEszett(q.questionDe) || hasEszett(q.answerDe)) {
      errors.push(`questions[${i}]: contains 'ß' — use 'ss'`);
    }
  });
}

function validateStory(story, fileName) {
  const errors = [];
  const expectedId = fileName.replace(/\.json$/, '');

  if (story.id !== expectedId) {
    errors.push(`id ("${story.id}") must match filename "${expectedId}"`);
  }
  for (const field of ['title', 'titleEn', 'animal', 'theme', 'createdAt']) {
    if (typeof story[field] !== 'string' || !story[field].trim()) {
      errors.push(`missing required string field "${field}"`);
    }
  }

  validateSvgString(story.coverSvg, 'coverSvg', errors);

  if (!Array.isArray(story.vocabulary) || story.vocabulary.length < 2 || story.vocabulary.length > 6) {
    errors.push(`vocabulary must contain 2–6 items (found ${story.vocabulary?.length ?? 0})`);
  } else {
    story.vocabulary.forEach((v, i) => {
      if (!VALID_ARTICLES.has(v.article)) {
        errors.push(`vocabulary[${i}].article must be der, die, or das (got "${v.article}")`);
      }
      if (!v.word || !v.translationEn) {
        errors.push(`vocabulary[${i}] must have word and translationEn`);
      }
    });
  }

  if (!Array.isArray(story.scenes) || story.scenes.length < 6 || story.scenes.length > 8) {
    errors.push(`scenes must contain 6–8 items (found ${story.scenes?.length ?? 0})`);
  } else {
    story.scenes.forEach((s, i) => {
      if (!s.textDe || !s.textEn) {
        errors.push(`scenes[${i}] must have textDe and textEn`);
      }
      if (!s.imageUrl) {
        validateSvgString(s.svg, `scenes[${i}].svg`, errors);
      }
    });
  }

  if (!Array.isArray(story.questions) || story.questions.length !== 5) {
    errors.push(`questions must contain exactly 5 items (found ${story.questions?.length ?? 0})`);
  } else {
    story.questions.forEach((q, i) => {
      if (!VALID_Q_TYPES.has(q.type)) {
        errors.push(`questions[${i}].type must be recall, vocab, or open (got "${q.type}")`);
      }
      if (!q.questionDe || !q.questionEn || !q.answerDe || !q.answerEn) {
        errors.push(`questions[${i}] must have questionDe, questionEn, answerDe, and answerEn`);
      }
    });
  }

  checkNoEszettInStory(story, errors);
  return errors;
}

if (!fs.existsSync(STORIES_DIR)) {
  fs.mkdirSync(STORIES_DIR, { recursive: true });
}

const files = fs
  .readdirSync(STORIES_DIR)
  .filter((f) => f.endsWith('.json') && f !== 'index.json')
  .sort();

const indexEntries = [];
let hasErrors = false;

for (const file of files) {
  const fullPath = path.join(STORIES_DIR, file);
  let story;
  try {
    story = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  } catch (err) {
    console.error(`❌ ${file}: invalid JSON — ${err.message}`);
    hasErrors = true;
    continue;
  }

  const errors = validateStory(story, file);
  if (errors.length > 0) {
    console.error(`❌ ${file} failed validation:`);
    for (const err of errors) {
      console.error(`   - ${err}`);
    }
    hasErrors = true;
    continue;
  }

  indexEntries.push({
    id: story.id,
    title: story.title,
    titleEn: story.titleEn,
    animal: story.animal,
    animalEmoji: story.animalEmoji || '🐾',
    theme: story.theme,
    createdAt: story.createdAt,
    sceneCount: story.scenes.length,
    coverSvg: story.coverSvg,
    vocabulary: story.vocabulary,
  });
}

if (hasErrors) {
  process.exit(1);
}

// Sort newest first
indexEntries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

fs.writeFileSync(
  INDEX_PATH,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      storyCount: indexEntries.length,
      stories: indexEntries,
    },
    null,
    2
  ) + '\n',
  'utf-8'
);

console.log(`✅ Validated ${indexEntries.length} published stories and rebuilt public/stories/index.json`);
