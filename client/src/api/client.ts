import type {
  PlaylistImportResult,
  SelectSongsResult,
  McAudio,
  CharacterPreset,
  SongAnalysis,
} from '../types';

const BASE = '/api';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function importPlaylist(
  url: string,
  previous?: { videoId: string; title: string }[]
): Promise<PlaylistImportResult> {
  return post<PlaylistImportResult>('/playlist/import', { url, previous });
}

export async function analyzeSongs(
  videos: { videoId: string; title: string; author: string }[],
  batch?: boolean
): Promise<{ analyses: { videoId: string; analysis: SongAnalysis | null }[] }> {
  return post('/analyze/analyze', { videos, batch: batch ?? videos.length > 1 });
}

export async function selectSongs(
  instruction: string,
  songs: { videoId: string; title: string; author: string; analysis: SongAnalysis | null }[],
  history: { videoId: string; count: number; liked: boolean }[],
  count?: number
): Promise<SelectSongsResult> {
  return post<SelectSongsResult>('/select/select', {
    instruction,
    songs,
    history,
    count,
  });
}

export async function getPresets(): Promise<CharacterPreset[]> {
  const res = await fetch(`${BASE}/tts/presets`);
  if (!res.ok) throw new Error('Failed to fetch presets');
  return res.json();
}

export async function generateMcAudio(
  presetId: string,
  currentSong: { title: string; author: string; analysis: SongAnalysis | null },
  nextSong: { title: string; author: string; analysis: SongAnalysis | null }
): Promise<McAudio> {
  return post<McAudio>('/tts/mc-generate', {
    presetId,
    currentSong,
    nextSong,
  });
}

export async function textToSpeech(
  text: string,
  presetId: string
): Promise<{ audio: string }> {
  return post('/tts/tts', { text, presetId });
}
