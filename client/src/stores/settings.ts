import { create } from 'zustand';
import type { CharacterPreset } from '../types';
import * as api from '../api/client';

interface SettingsState {
  presets: CharacterPreset[];
  selectedPresetId: string;
  presetsLoaded: boolean;

  loadPresets: () => Promise<void>;
  selectPreset: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  presets: [],
  selectedPresetId: 'zundamon-normal',
  presetsLoaded: false,

  loadPresets: async () => {
    if (get().presetsLoaded) return;
    try {
      const presets = await api.getPresets();
      set({ presets, presetsLoaded: true });
    } catch {
      set({ presets: [], presetsLoaded: false });
    }
  },

  selectPreset: (id) => set({ selectedPresetId: id }),
}));
