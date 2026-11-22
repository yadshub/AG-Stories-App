---
name: create-story
description: Create and publish a new Schweizer Hochdeutsch animal picture story (with flat-vector SVGs, English parent translations, der/die/das vocabulary, and 5 end-of-story Q&As) for a 4-year-old in a Swiss kindergarten.
---

# Create a New Schweizer Hochdeutsch Picture Story

Follow this workflow whenever Dad asks to generate 1 or more new stories for the app.

## Step 1: Check Existing Stories (Prevent Duplicates & Support Spaced Repetition)

Read `public/stories/index.json` first:
- Note all existing `title`, `animal`, `theme`, and `vocabulary` entries.
- Pick a **fresh plot** that does not repeat an existing story.
- Introduce **2–4 new everyday vocabulary words** (nouns with `der` / `die` / `das`) appropriate for a 4-year-old in a Swiss German kindergarten.
- Optionally **recycle 1–2 words** from older stories naturally inside the scene text for gentle spaced repetition.

## Step 2: Language & Pedagogy Rules (Schweizer Hochdeutsch)

- **ZERO `ß` characters anywhere!** Always use Swiss `ss` (`gross`, `Strasse`, `weiss`, `heiss`, `Spass`, `draussen`, `Fuss`).
- Use **simple present tense (*Präsens*)**, A1 level, 1–3 short warm sentences per scene.
- Weave in natural Swiss kid vocabulary where authentic (*das Velo*, *das Rüebli*, *das Znüni*, *die Glace*, *der Kindergarten*, *der Rucksack*, *der Schlitten*, *die Wiese*).
- Always star a friendly **animal hero** (e.g., Bär, Fuchs, Ente, Hase, Igel, Eichhörnchen, Eule, Hund, Katze, Elefant, Pinguin, Murmeltier).
- Tone: gentle, warm, joyful, bedtime-friendly (no scary conflict, always a happy resolution).

## Step 3: Story Structure & Schema

Save each new story to `public/stories/<kebab-case-id>.json` (where `id` matches the filename without `.json`).

Required JSON fields:
- `id`: kebab-case ASCII slug matching filename (e.g. `emil-igel-regen`)
- `title`: short German title (no `ß`)
- `titleEn`: English title for parents
- `animal`: German animal name (e.g. `Igel`)
- `animalEmoji`: single emoji (e.g. `🦔`)
- `theme`: short German theme label (e.g. `Regenwetter`, `Kindergarten`, `Schnee`, `Spielplatz`)
- `createdAt`: ISO-8601 timestamp
- `coverSvg`: warm flat-vector `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">...</svg>`
- `vocabulary`: array of **3–4 items**, each `{ "article": "der"|"die"|"das", "word": "...", "translationEn": "...", "emoji": "..." }`
- `scenes`: array of **6–8 scenes**, each:
  - `index`: `1..N`
  - `textDe`: 1–3 short Swiss Hochdeutsch sentences
  - `textEn`: clear English translation for non-native parents
  - `highlightWords`: array of exact vocabulary words appearing in `textDe` (case-insensitive match)
  - `svg`: custom flat-vector `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">...</svg>`
- `questions`: **exact 5 items** at the end:
  - 3 items with `"type": "recall"` (easy pointing/recall questions about what happened)
  - 1 item with `"type": "vocab"` (reinforces one of the story's `der`/`die`/`das` target words)
  - 1 item with `"type": "open"` (playful imagination/personal question like *"Was würdest du tun?"*)
  - Each item has `questionDe`, `questionEn`, `answerDe`, `answerEn` (no `ß`).

## Step 4: Storybook SVG Art Direction

- Always use `viewBox="0 0 400 300"` and `xmlns="http://www.w3.org/2000/svg"`.
- Style: charming Eric Carle / modern flat picture-book illustration with soft rounded shapes and warm pastel colors.
- **Character consistency**: Design the hero animal once (same body/head colors, ears, rosy cheeks, eyes, snout/beak) and keep it unmistakably consistent across `coverSvg` and all 6–8 scenes, changing pose, expression, and props per scene!
- Layer order: Sky/backdrop -> Sun/clouds/hills/trees -> Ground/path -> Props -> Animal character(s) -> Foreground accents.
- Subtle CSS classes available from `src/index.css`: `kg-float` (clouds/birds/snow), `kg-bob` (gentle happy bounce), `kg-sway` (trees/flowers).
- Never include `<script>`, `on*=` attributes, or external image URLs.

## Step 5: Validate & Rebuild Index

Always run:
```bash
npm run validate:stories
```
Fix any reported validation errors (missing fields, `ß` warnings, invalid SVGs, wrong question count) before finishing. Then remind the user they can preview with `npm run dev` or publish to their wife's phone via `git push`.
