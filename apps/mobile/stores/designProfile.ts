import { create } from 'zustand';
import {
  ARCHETYPES,
  DEFAULT_DESIGN_PROFILE,
  type AccessibilityProfile,
  type ArchetypeId,
  type NeedState,
  type UserDesignProfile,
} from '../lib/theme';

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

type CalibrationInput = {
  needState: NeedState;
  sensorySafe?: boolean;
  motion?: AccessibilityProfile['motion'];
  contrast?: AccessibilityProfile['contrast'];
  density?: AccessibilityProfile['density'];
  textScale?: AccessibilityProfile['textScale'];
  plainLanguage?: boolean;
};

type DesignProfileStore = {
  profile: UserDesignProfile;
  hasCompletedCalibration: boolean;
  hydrated: boolean;
  hydrate: () => void;
  setArchetype: (archetypeId: ArchetypeId) => void;
  setCurrentNeedState: (needState: NeedState) => void;
  setAccessibility: (patch: Partial<AccessibilityProfile>) => void;
  applyCalibration: (input: CalibrationInput) => void;
  resetDesignProfile: () => void;
};

const STORAGE_KEY = 'innerscape.designProfile.v1';
const CALIBRATED_KEY = 'innerscape.designProfile.calibrated.v1';

const archetypeByNeedState: Record<NeedState, ArchetypeId> = {
  decompression: 'hushGarden',
  clarity: 'clearStudio',
  activation: 'sparkCurrent',
  reflection: 'moonRoom',
  play: 'playLab',
  sensorySafety: 'quietSignal',
};

function getStorage(): StorageLike | null {
  const maybeGlobal = globalThis as typeof globalThis & { localStorage?: StorageLike };
  return maybeGlobal.localStorage ?? null;
}

function persist(profile: UserDesignProfile, calibrated: boolean) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(profile));
  storage.setItem(CALIBRATED_KEY, calibrated ? 'true' : 'false');
}

function validProfile(value: unknown): value is UserDesignProfile {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as UserDesignProfile;
  return Boolean(candidate.archetypeId && ARCHETYPES[candidate.archetypeId] && candidate.accessibility);
}

export const useDesignProfileStore = create<DesignProfileStore>((set, get) => ({
  profile: DEFAULT_DESIGN_PROFILE,
  hasCompletedCalibration: false,
  hydrated: false,
  hydrate: () => {
    const storage = getStorage();
    if (!storage) {
      set({ hydrated: true });
      return;
    }

    try {
      const rawProfile = storage.getItem(STORAGE_KEY);
      const parsed = rawProfile ? JSON.parse(rawProfile) : null;
      const hasCompletedCalibration = storage.getItem(CALIBRATED_KEY) === 'true';
      set({
        profile: validProfile(parsed) ? parsed : DEFAULT_DESIGN_PROFILE,
        hasCompletedCalibration,
        hydrated: true,
      });
    } catch {
      set({ profile: DEFAULT_DESIGN_PROFILE, hasCompletedCalibration: false, hydrated: true });
    }
  },
  setArchetype: (archetypeId) => {
    const next = { ...get().profile, archetypeId, currentNeedState: ARCHETYPES[archetypeId].needState };
    set({ profile: next });
    persist(next, get().hasCompletedCalibration);
  },
  setCurrentNeedState: (needState) => {
    const archetypeId = archetypeByNeedState[needState];
    const next = { ...get().profile, currentNeedState: needState, archetypeId };
    set({ profile: next });
    persist(next, get().hasCompletedCalibration);
  },
  setAccessibility: (patch) => {
    const next = { ...get().profile, accessibility: { ...get().profile.accessibility, ...patch } };
    set({ profile: next });
    persist(next, get().hasCompletedCalibration);
  },
  applyCalibration: (input) => {
    const archetypeId = archetypeByNeedState[input.needState];
    const baseAccessibility = get().profile.accessibility;
    const next: UserDesignProfile = {
      archetypeId,
      currentNeedState: input.needState,
      accessibility: {
        ...baseAccessibility,
        motion: input.motion ?? (input.sensorySafe ? 'none' : baseAccessibility.motion),
        contrast: input.contrast ?? baseAccessibility.contrast,
        density: input.density ?? (input.needState === 'activation' ? 'compact' : input.needState === 'sensorySafety' ? 'spacious' : baseAccessibility.density),
        textScale: input.textScale ?? baseAccessibility.textScale,
        plainLanguage: input.plainLanguage ?? baseAccessibility.plainLanguage,
        sensorySafe: input.sensorySafe ?? input.needState === 'sensorySafety',
      },
    };
    set({ profile: next, hasCompletedCalibration: true });
    persist(next, true);
  },
  resetDesignProfile: () => {
    set({ profile: DEFAULT_DESIGN_PROFILE, hasCompletedCalibration: false });
    persist(DEFAULT_DESIGN_PROFILE, false);
  },
}));
