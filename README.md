# Tier-Geschichten — Schweizer Hochdeutsch Bilderbücher

An installable, offline-capable Android PWA designed for non-native German-speaking parents reading short, animal-centered *Schweizer Hochdeutsch* picture stories to their 4-year-old child.

## Features

- **Portrait-First Swipeable Picture Book**: Scene-by-scene custom flat-vector SVGs (`4:3`) with large rounded German text, discreet tap-to-reveal **English parent translations**, and interactive gender-color-coded vocabulary words (**blue *der***, **red *die***, **green *das***).
- **5 End-of-Story Q&A Cards**: Every story ends with 5 swipeable comprehension & imagination questions (3 recall, 1 vocabulary check, 1 open-ended) with hidden tap-to-reveal German answers and English parent hints.
- **Wortschatz (Vocabulary Bank)**: Collects every target word across published and phone-generated stories, filterable by article (`der`/`die`/`das`) and local practiced stars (`⭐`).
- **Phone-Side Story Generator (BYOK, \$0/month)**: Tap **Neu** on Android, pick an animal + theme, and generate a brand-new illustrated story in ~10–15 seconds using your own free-tier Google Gemini API key (saved privately in the phone's `localStorage`, stories saved in `IndexedDB` with Delete and Android Share/Export JSON).
- **Dad-Side Agent Authoring Workflow**: Use the workspace skill `.agents/skills/create-story/SKILL.md` to generate vetted batches of stories locally, validate with `npm run validate:stories`, and publish to your wife's phone via `git push`.
- **Warm Storybook Paper Theme + Bedtime Dim Mode** & automatic offline PWA caching.

---

## Local Development

```bash
npm install
npm run validate:stories
npm run dev
```

## Publishing Free to GitHub Pages (Android Phone Setup)

1. Create a new GitHub repository and push this project to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial Tier-Geschichten PWA"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. In your GitHub repo settings: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Wait ~30 seconds for the **Deploy PWA to GitHub Pages** workflow to finish, then open the live URL in **Chrome on your wife's Android phone**.
4. Tap Chrome's menu (`⋮`) → **Add to Home screen** / **Install app**.
5. *(Optional, for phone-side story generation)* Grab a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey), tap the **Settings (⚙️)** icon in the app on her phone, and paste it once.

## Adding New Stories (Dad Workflow)

Ask your coding agent in this repo (e.g. *"Use the create-story skill to add 2 new stories about a hedgehog and a penguin"*), then run:

```bash
npm run validate:stories
git add public/stories
git commit -m "Add new stories"
git push
```

Your wife's phone will automatically cache the new stories and show a gentle **"Neue Geschichten verfügbar!"** banner.
