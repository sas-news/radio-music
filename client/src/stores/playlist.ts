import { create } from 'zustand';
import type { Playlist, Song, SongAnalysis } from '../types';
import * as db from '../db';
import * as api from '../api/client';

interface PlaylistState {
  playlists: Playlist[];
  songs: Song[];
  selectedPlaylistId: string | null;
  isImporting: boolean;
  isAnalyzing: boolean;
  importError: string | null;

  loadPlaylists: () => Promise<void>;
  loadSongs: (playlistId?: string) => Promise<void>;
  selectPlaylist: (playlistId: string | null) => void;
  importPlaylist: (url: string) => Promise<void>;
  syncPlaylist: (url: string) => Promise<void>;
  analyzeSongs: (songIndices: number[]) => Promise<void>;
  analyzeAllUnanalyzed: () => Promise<void>;
  rateSong: (videoId: string, score: -1 | 0 | 1) => Promise<void>;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  songs: [],
  selectedPlaylistId: null,
  isImporting: false,
  isAnalyzing: false,
  importError: null,

  loadPlaylists: async () => {
    const playlists = await db.getAllPlaylists();
    set({ playlists });
  },

  loadSongs: async (playlistId) => {
    const songs = await db.getAllSongs(playlistId);
    set({ songs });
  },

  selectPlaylist: (playlistId) => {
    set({ selectedPlaylistId: playlistId });
    get().loadSongs(playlistId || undefined);
  },

  importPlaylist: async (url) => {
    set({ isImporting: true, importError: null });
    try {
      const result = await api.importPlaylist(url);
      await db.saveImportResult(result.meta.id, result.meta, result.videos);
      await get().loadPlaylists();
      set({ selectedPlaylistId: result.meta.id, isImporting: false });
      await get().loadSongs(result.meta.id);

      const unanalyzed = get().songs.filter((s) => !s.analysis);
      if (unanalyzed.length > 0) {
        const indices = get().songs
          .map((s, i) => (s.analysis ? -1 : i))
          .filter((i) => i >= 0)
          .slice(0, 10);
        await get().analyzeSongs(indices);
      }
    } catch (err) {
      set({ isImporting: false, importError: err instanceof Error ? err.message : 'Import failed' });
    }
  },

  syncPlaylist: async (url) => {
    set({ isImporting: true, importError: null });
    try {
      const { songs: currentSongs } = get();
      const previous = currentSongs.map((s) => ({ videoId: s.videoId, title: s.title }));
      const result = await api.importPlaylist(url, previous);

      if (result.diff) {
        if (result.diff.removed.length > 0) {
          await db.removeSongs(result.diff.removed.map((r) => r.videoId));
        }
      }

      await db.saveImportResult(result.meta.id, result.meta, result.videos);
      await get().loadSongs(result.meta.id);

      if (result.diff) {
        set({
          isImporting: false,
          importError: null,
        });
      }
    } catch (err) {
      set({ isImporting: false, importError: err instanceof Error ? err.message : 'Sync failed' });
    }
  },

  analyzeSongs: async (indices) => {
    set({ isAnalyzing: true });
    const { songs } = get();
    const toAnalyze = indices.map((i) => songs[i]).filter(Boolean);

    try {
      const { analyses } = await api.analyzeSongs(
        toAnalyze.map((s) => ({ videoId: s.videoId, title: s.title, author: s.author })),
        toAnalyze.length > 1
      );

      for (const item of analyses) {
        await db.updateSongAnalysis(item.videoId, item.analysis as SongAnalysis);
      }

      await get().loadSongs(get().selectedPlaylistId || undefined);
      set({ isAnalyzing: false });
    } catch (err) {
      set({ isAnalyzing: false });
    }
  },

  analyzeAllUnanalyzed: async () => {
    const { songs } = get();
    const unanalyzedIndices = songs
      .map((s, i) => (s.analysis ? -1 : i))
      .filter((i) => i >= 0);

    if (unanalyzedIndices.length === 0) return;

    const batchSize = 5;
    for (let i = 0; i < unanalyzedIndices.length; i += batchSize) {
      const batch = unanalyzedIndices.slice(i, i + batchSize);
      await get().analyzeSongs(batch);
    }
  },

  rateSong: async (videoId, score) => {
    await db.rateSong(videoId, score);
  },
}));
