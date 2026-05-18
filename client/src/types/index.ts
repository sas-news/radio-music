export interface SongAnalysis {
  songTitle: string;
  artist: string;
  genre: string[];
  tempo: 'very slow' | 'slow' | 'medium' | 'fast' | 'very fast';
  mood: string[];
  theme: string[];
  era: string;
  language: string;
  notableFeatures: string;
}

export interface Song {
  id?: number;
  videoId: string;
  title: string;
  author: string;
  durationSec: number;
  thumbnail: string;
  position: number;
  analysis: SongAnalysis | null;
  analyzedAt: string | null;
  playlistId: string;
}

export interface Playlist {
  id?: number;
  playlistId: string;
  title: string;
  author: string;
  thumbnail: string;
  videoCount: number;
  importedAt: string;
  lastSyncedAt: string | null;
}

export interface SongRating {
  id?: number;
  songVideoId: string;
  score: -1 | 0 | 1;
  ratedAt: string;
}

export interface PlayHistory {
  id?: number;
  songVideoId: string;
  playedAt: string;
  completed: boolean;
  skipped: boolean;
}

export interface CharacterPreset {
  id: string;
  name: string;
  speakerId: number;
  personality: string;
  catchphrase: string;
  description: string;
  speedScale: number;
  pitchScale: number;
  emoji: string;
}

export interface McScript {
  intro: string;
  outro: string;
}

export interface McAudio {
  script: McScript;
  audio: {
    intro: string;
    outro: string;
  };
}

export interface PlaylistImportResult {
  meta: {
    id: string;
    title: string;
    author: string;
    thumbnail: string;
    videoCount: number;
  };
  videos: {
    videoId: string;
    title: string;
    author: string;
    durationSec: number;
    thumbnail: string;
    position: number;
  }[];
  diff?: {
    added: { videoId: string; title: string; durationSec: number; thumbnail: string; position: number }[];
    removed: { videoId: string; title: string }[];
    unchanged: number;
  };
}

export interface SelectSongsResult {
  videoIds: string[];
  reasoning: string;
}

export type PlayerStatus = 'idle' | 'playing' | 'paused';

export interface RadioQueueItem {
  type: 'mc-intro' | 'song' | 'mc-outro';
  songVideoId?: string;
  audioUrl?: string;
  mcScript?: string;
  index: number;
}
