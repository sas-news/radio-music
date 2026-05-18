import { create } from 'zustand';
import type { Song, PlayerStatus, RadioQueueItem } from '../types';

interface PlayerState {
  status: PlayerStatus;
  currentSong: Song | null;
  queue: Song[];
  queueIndex: number;
  volume: number;
  radioMode: boolean;
  radioQueue: RadioQueueItem[];
  radioQueueIndex: number;
  isLoading: boolean;

  setStatus: (status: PlayerStatus) => void;
  playSong: (song: Song) => void;
  playQueue: (songs: Song[], startIndex?: number) => void;
  nextTrack: () => Song | null;
  prevTrack: () => Song | null;
  setVolume: (volume: number) => void;
  toggleRadioMode: () => void;
  setRadioQueue: (items: RadioQueueItem[]) => void;
  advanceRadioQueue: () => RadioQueueItem | null;
  setLoading: (loading: boolean) => void;
  clearQueue: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  status: 'idle',
  currentSong: null,
  queue: [],
  queueIndex: -1,
  volume: 0.8,
  radioMode: false,
  radioQueue: [],
  radioQueueIndex: -1,
  isLoading: false,

  setStatus: (status) => set({ status }),

  playSong: (song) => set({ currentSong: song, status: 'playing', queue: [song], queueIndex: 0 }),

  playQueue: (songs, startIndex = 0) =>
    set({
      queue: songs,
      queueIndex: startIndex,
      currentSong: songs[startIndex] || null,
      status: songs.length > 0 ? 'playing' : 'idle',
    }),

  nextTrack: () => {
    const { queue, queueIndex } = get();
    if (queueIndex + 1 >= queue.length) return null;
    const next = queue[queueIndex + 1];
    set({ queueIndex: queueIndex + 1, currentSong: next, status: 'playing' });
    return next;
  },

  prevTrack: () => {
    const { queue, queueIndex } = get();
    if (queueIndex <= 0) return null;
    const prev = queue[queueIndex - 1];
    set({ queueIndex: queueIndex - 1, currentSong: prev, status: 'playing' });
    return prev;
  },

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  toggleRadioMode: () => set((s) => ({ radioMode: !s.radioMode })),

  setRadioQueue: (items) => set({ radioQueue: items, radioQueueIndex: 0 }),

  advanceRadioQueue: () => {
    const { radioQueue, radioQueueIndex } = get();
    if (radioQueueIndex + 1 >= radioQueue.length) return null;
    const next = radioQueue[radioQueueIndex + 1];
    set({ radioQueueIndex: radioQueueIndex + 1 });
    return next;
  },

  setLoading: (loading) => set({ isLoading: loading }),

  clearQueue: () => set({ queue: [], queueIndex: -1, currentSong: null, status: 'idle' }),
}));
