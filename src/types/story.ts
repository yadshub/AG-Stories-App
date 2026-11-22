export type GermanArticle = 'der' | 'die' | 'das';

export type QuestionType = 'recall' | 'vocab' | 'open';

export type StorySource = 'published' | 'local';

export interface VocabWord {
  article: GermanArticle;
  word: string;
  translationEn: string;
  emoji?: string;
}

export interface StoryScene {
  index: number;
  textDe: string;
  textEn: string;
  highlightWords?: string[];
  svg: string;
  imageUrl?: string;
  audioUrl?: string; // Reserved for future Swiss neural TTS support
}

export interface StoryQuestion {
  type: QuestionType;
  questionDe: string;
  questionEn: string;
  answerDe: string;
  answerEn: string;
  audioUrl?: string; // Reserved for future audio support
}

export interface Story {
  id: string;
  title: string;
  titleEn: string;
  animal: string;
  animalEmoji?: string;
  theme: string;
  createdAt: string;
  source?: StorySource;
  coverSvg: string;
  vocabulary: VocabWord[];
  scenes: StoryScene[];
  questions: StoryQuestion[];
}

export interface StoryIndexEntry {
  id: string;
  title: string;
  titleEn: string;
  animal: string;
  animalEmoji?: string;
  theme: string;
  createdAt: string;
  sceneCount: number;
  coverSvg: string;
  vocabulary: VocabWord[];
  source: StorySource;
}

export interface PublishedIndexResponse {
  generatedAt: string;
  storyCount: number;
  stories: Omit<StoryIndexEntry, 'source'>[];
}

export interface AppSettings {
  geminiApiKey: string;
  geminiModel: string;
  bedtimeMode: boolean;
}
