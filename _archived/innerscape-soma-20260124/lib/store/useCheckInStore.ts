import { create } from 'zustand';

interface CheckInState {
  selectedRegions: string[];
  selectedEmotion: string | null;
  selectedSensations: string[];
  reflection: string;
  
  // Actions
  setRegions: (regions: string[]) => void;
  toggleRegion: (regionId: string) => void;
  setEmotion: (emotion: string | null) => void;
  setSensations: (sensations: string[]) => void;
  toggleSensation: (sensation: string) => void;
  setReflection: (reflection: string) => void;
  reset: () => void;
}

export const useCheckInStore = create<CheckInState>((set) => ({
  selectedRegions: [],
  selectedEmotion: null,
  selectedSensations: [],
  reflection: '',

  setRegions: (regions) => set({ selectedRegions: regions }),
  toggleRegion: (regionId) => set((state) => ({
    selectedRegions: state.selectedRegions.includes(regionId)
      ? state.selectedRegions.filter(id => id !== regionId)
      : [...state.selectedRegions, regionId]
  })),
  setEmotion: (emotion) => set({ selectedEmotion: emotion }),
  setSensations: (sensations) => set({ selectedSensations: sensations }),
  toggleSensation: (sensation) => set((state) => ({
    selectedSensations: state.selectedSensations.includes(sensation)
      ? state.selectedSensations.filter(s => s !== sensation)
      : [...state.selectedSensations, sensation]
  })),
  setReflection: (reflection) => set({ reflection }),
  reset: () => set({
    selectedRegions: [],
    selectedEmotion: null,
    selectedSensations: [],
    reflection: ''
  }),
}));
