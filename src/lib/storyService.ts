import type { PublishedIndexResponse, Story, StoryIndexEntry } from '../types/story';
import { getLocalStories, getLocalStoryById } from './storage';

function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL || './';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${relativePath.replace(/^\//, '')}`;
}

export async function loadAllStoryEntries(): Promise<StoryIndexEntry[]> {
  const [publishedEntries, localStories] = await Promise.all([
    fetchPublishedIndex(),
    getLocalStories(),
  ]);

  const localEntries: StoryIndexEntry[] = localStories.map((s) => ({
    id: s.id,
    title: s.title,
    titleEn: s.titleEn,
    animal: s.animal,
    animalEmoji: s.animalEmoji || '🐾',
    theme: s.theme,
    createdAt: s.createdAt,
    sceneCount: s.scenes.length,
    coverSvg: s.coverSvg,
    vocabulary: s.vocabulary,
    source: 'local',
  }));

  // Local stories first (newest created on phone), then published stories
  return [...localEntries, ...publishedEntries];
}

async function fetchPublishedIndex(): Promise<StoryIndexEntry[]> {
  try {
    const res = await fetch(assetUrl('stories/index.json'), { cache: 'no-cache' });
    if (!res.ok) return [];
    const data = (await res.json()) as PublishedIndexResponse;
    return (data.stories || []).map((entry) => ({
      ...entry,
      source: 'published' as const,
    }));
  } catch {
    return [];
  }
}

export async function loadStoryDetail(entry: Pick<StoryIndexEntry, 'id' | 'source'>): Promise<Story> {
  if (entry.source === 'local') {
    const local = await getLocalStoryById(entry.id);
    if (!local) {
      throw new Error('Diese lokale Geschichte wurde nicht gefunden.');
    }
    return local;
  }

  const res = await fetch(assetUrl(`stories/${entry.id}.json`));
  if (!res.ok) {
    throw new Error('Geschichte konnte nicht geladen werden.');
  }
  const story = (await res.json()) as Story;
  return { ...story, source: 'published' };
}

export async function shareOrExportStory(story: Story): Promise<'shared' | 'downloaded'> {
  const cleanStory: Story = {
    ...story,
    source: undefined,
  };
  const json = JSON.stringify(cleanStory, null, 2);
  const fileName = `${story.id}.json`;

  // Prefer native Android Share Sheet (works directly with WhatsApp!)
  try {
    const file = new File([json], fileName, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: story.title,
        text: `Geschichte für unseren Sohn: ${story.title}`,
        files: [file],
      });
      return 'shared';
    }
  } catch (err) {
    // User cancelled share or file share unsupported — fall back to download unless aborted
    if (err instanceof DOMException && err.name === 'AbortError') {
      return 'shared';
    }
  }

  // Fallback: trigger JSON file download
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return 'downloaded';
}
