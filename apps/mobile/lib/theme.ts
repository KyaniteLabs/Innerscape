import { Platform } from 'react-native';

export type NeedState =
  | 'decompression'
  | 'clarity'
  | 'activation'
  | 'reflection'
  | 'play'
  | 'sensorySafety';

export type ArchetypeId =
  | 'hushGarden'
  | 'clearStudio'
  | 'sparkCurrent'
  | 'moonRoom'
  | 'playLab'
  | 'quietSignal';

export type AccessibilityProfile = {
  motion: 'full' | 'reduced' | 'none';
  contrast: 'soft' | 'standard' | 'high';
  density: 'compact' | 'standard' | 'spacious';
  textScale: 'standard' | 'large' | 'extraLarge';
  plainLanguage: boolean;
  sensorySafe: boolean;
};

export type UserDesignProfile = {
  archetypeId: ArchetypeId;
  accessibility: AccessibilityProfile;
  currentNeedState?: NeedState;
};

type Tone = 'direct' | 'gentle' | 'bright' | 'intimate' | 'curious' | 'quiet';
type MotionRhythm = 'still' | 'slow' | 'crisp' | 'pulse' | 'bounce' | 'none';
type DensityPreference = AccessibilityProfile['density'];

type ArchetypeTokens = {
  id: ArchetypeId;
  name: string;
  needState: NeedState;
  needLabel: string;
  goodFor: string;
  voice: string;
  palette: {
    background: string;
    backgroundAlt: string;
    card: string;
    elevated: string;
    elevated2: string;
    border: string;
    borderStrong: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textDim: string;
    inverse: string;
    primary: string;
    secondary: string;
    tertiary: string;
    glow: string;
    veil: string;
  };
  vocabulary: {
    typePersonality: string;
    shape: 'organic' | 'precise' | 'directional' | 'layered' | 'modular' | 'quiet';
    iconStyle: string;
    illustrationStyle: string;
    copyTone: Tone;
    motionRhythm: MotionRhythm;
    defaultDensity: DensityPreference;
    surfaceTexture: string;
  };
};

const PALETTE = {
  void: '#05070B',
  ink: '#08101A',
  obsidian: '#0B1220',
  graphite: '#111827',
  graphite2: '#172033',
  line: 'rgba(174, 229, 255, 0.14)',
  lineStrong: 'rgba(174, 229, 255, 0.24)',
  white: '#F7FBFF',
  mist: '#D7E7F5',
  muted: '#8EA3B7',
  dim: '#5F7184',
  neuro: '#72F7FF',
  neuroDeep: '#13B8C8',
  violet: '#A78BFA',
  amber: '#FFD166',
  soma: '#FF7AB6',
  hub: '#74A7FF',
  green: '#74F2A6',
  red: '#FF6B7A',
} as const;

const ARCHETYPES: Record<ArchetypeId, ArchetypeTokens> = {
  hushGarden: {
    id: 'hushGarden',
    name: 'Hush Garden',
    needState: 'decompression',
    needLabel: 'Decompression',
    goodFor: 'overwhelm, transition time, masking recovery, low sensory bandwidth',
    voice: 'Soft, spacious, and protective without becoming childish.',
    palette: {
      background: '#08110E',
      backgroundAlt: '#0D1A15',
      card: '#13241D',
      elevated: '#1B3027',
      elevated2: '#213C31',
      border: 'rgba(178, 238, 202, 0.16)',
      borderStrong: 'rgba(178, 238, 202, 0.31)',
      textPrimary: '#F3FFF7',
      textSecondary: '#CDE8D7',
      textMuted: '#95B8A4',
      textDim: '#6E8D7C',
      inverse: '#07120E',
      primary: '#A8F0C6',
      secondary: '#86DCC8',
      tertiary: '#E9CDA8',
      glow: 'rgba(168, 240, 198, 0.18)',
      veil: 'rgba(8, 17, 14, 0.78)',
    },
    vocabulary: {
      typePersonality: 'soft editorial',
      shape: 'organic',
      iconStyle: 'leaf-vein line glyphs',
      illustrationStyle: 'biomorphic shadows and gentle growth rings',
      copyTone: 'gentle',
      motionRhythm: 'slow',
      defaultDensity: 'spacious',
      surfaceTexture: 'moss glass, soft grain, botanical halos',
    },
  },
  clearStudio: {
    id: 'clearStudio',
    name: 'Clear Studio',
    needState: 'clarity',
    needLabel: 'Clarity',
    goodFor: 'planning, executive-function support, making the next choice visible',
    voice: 'Editorial, legible, structured, and calm.',
    palette: {
      background: '#F4F0E8',
      backgroundAlt: '#EBE4D7',
      card: '#FFFCF5',
      elevated: '#F1E8D9',
      elevated2: '#E6DBC9',
      border: 'rgba(72, 62, 49, 0.16)',
      borderStrong: 'rgba(72, 62, 49, 0.32)',
      textPrimary: '#241D16',
      textSecondary: '#493F35',
      textMuted: '#74695E',
      textDim: '#978B7E',
      inverse: '#FFF8EC',
      primary: '#255C7A',
      secondary: '#8D5A3B',
      tertiary: '#B58A35',
      glow: 'rgba(37, 92, 122, 0.14)',
      veil: 'rgba(244, 240, 232, 0.80)',
    },
    vocabulary: {
      typePersonality: 'clean humanist editorial',
      shape: 'precise',
      iconStyle: 'thin architectural marks',
      illustrationStyle: 'paper, ruled space, annotated blocks',
      copyTone: 'direct',
      motionRhythm: 'crisp',
      defaultDensity: 'standard',
      surfaceTexture: 'warm paper, ink lines, quiet margins',
    },
  },
  sparkCurrent: {
    id: 'sparkCurrent',
    name: 'Spark Current',
    needState: 'activation',
    needLabel: 'Activation',
    goodFor: 'task initiation, momentum, dopamine-seeking, getting unstuck',
    voice: 'Bright, directional, and energizing without shouting.',
    palette: {
      background: '#120B1E',
      backgroundAlt: '#1A1030',
      card: '#22123C',
      elevated: '#2B174E',
      elevated2: '#361E5D',
      border: 'rgba(255, 214, 102, 0.18)',
      borderStrong: 'rgba(255, 214, 102, 0.34)',
      textPrimary: '#FFF9E8',
      textSecondary: '#F1DCC8',
      textMuted: '#BDA9C7',
      textDim: '#8E7A99',
      inverse: '#150A1F',
      primary: '#FFD166',
      secondary: '#FF7AB6',
      tertiary: '#72F7FF',
      glow: 'rgba(255, 209, 102, 0.22)',
      veil: 'rgba(18, 11, 30, 0.76)',
    },
    vocabulary: {
      typePersonality: 'confident kinetic display',
      shape: 'directional',
      iconStyle: 'arrows, bolts, route markers',
      illustrationStyle: 'charged paths, sparks, currents, progress beams',
      copyTone: 'bright',
      motionRhythm: 'pulse',
      defaultDensity: 'compact',
      surfaceTexture: 'electric velvet, neon edges, directional bands',
    },
  },
  moonRoom: {
    id: 'moonRoom',
    name: 'Moon Room',
    needState: 'reflection',
    needLabel: 'Reflection',
    goodFor: 'journaling, grief, emotional naming, tender processing',
    voice: 'Intimate, grounded, and reflective with plain-language escape hatches.',
    palette: {
      background: '#070817',
      backgroundAlt: '#101026',
      card: '#171735',
      elevated: '#202046',
      elevated2: '#292854',
      border: 'rgba(190, 196, 255, 0.16)',
      borderStrong: 'rgba(190, 196, 255, 0.32)',
      textPrimary: '#F7F3FF',
      textSecondary: '#D8D4F2',
      textMuted: '#A7A1C8',
      textDim: '#79739D',
      inverse: '#0A0A1B',
      primary: '#C7B8FF',
      secondary: '#FFB7D5',
      tertiary: '#B7E6FF',
      glow: 'rgba(199, 184, 255, 0.20)',
      veil: 'rgba(7, 8, 23, 0.80)',
    },
    vocabulary: {
      typePersonality: 'quiet literary',
      shape: 'layered',
      iconStyle: 'moon-phase and window glyphs',
      illustrationStyle: 'soft glow, curtains, layered night gradients',
      copyTone: 'intimate',
      motionRhythm: 'slow',
      defaultDensity: 'spacious',
      surfaceTexture: 'night glass, moon halos, translucent layers',
    },
  },
  playLab: {
    id: 'playLab',
    name: 'Play Lab',
    needState: 'play',
    needLabel: 'Play',
    goodFor: 'curiosity, novelty, creative regulation, trying without pressure',
    voice: 'Tactile, curious, modular, and friendly without becoming chaotic.',
    palette: {
      background: '#10151F',
      backgroundAlt: '#151C2A',
      card: '#1D2638',
      elevated: '#25304A',
      elevated2: '#2E3A56',
      border: 'rgba(134, 220, 200, 0.18)',
      borderStrong: 'rgba(134, 220, 200, 0.36)',
      textPrimary: '#F4FAFF',
      textSecondary: '#D1E1EF',
      textMuted: '#A2B4C8',
      textDim: '#72859C',
      inverse: '#071018',
      primary: '#86DCC8',
      secondary: '#FFB86B',
      tertiary: '#A78BFA',
      glow: 'rgba(134, 220, 200, 0.20)',
      veil: 'rgba(16, 21, 31, 0.76)',
    },
    vocabulary: {
      typePersonality: 'rounded modular grotesk',
      shape: 'modular',
      iconStyle: 'blocks, knobs, friendly diagrams',
      illustrationStyle: 'constructive play pieces and soft lab labels',
      copyTone: 'curious',
      motionRhythm: 'bounce',
      defaultDensity: 'standard',
      surfaceTexture: 'matte modules, stickers, glass labels',
    },
  },
  quietSignal: {
    id: 'quietSignal',
    name: 'Quiet Signal',
    needState: 'sensorySafety',
    needLabel: 'Sensory safety',
    goodFor: 'autistic safety, predictability, low surprise, minimal input',
    voice: 'Precise, stable, and non-demanding.',
    palette: {
      background: '#0C0F12',
      backgroundAlt: '#11161A',
      card: '#171D22',
      elevated: '#1D242B',
      elevated2: '#242C33',
      border: 'rgba(220, 232, 238, 0.12)',
      borderStrong: 'rgba(220, 232, 238, 0.26)',
      textPrimary: '#F0F5F7',
      textSecondary: '#D2DEE3',
      textMuted: '#A4B3BB',
      textDim: '#77868E',
      inverse: '#0C0F12',
      primary: '#DCE8EE',
      secondary: '#AFC1CB',
      tertiary: '#88A3AD',
      glow: 'rgba(220, 232, 238, 0.08)',
      veil: 'rgba(12, 15, 18, 0.84)',
    },
    vocabulary: {
      typePersonality: 'plain precise system text',
      shape: 'quiet',
      iconStyle: 'minimal labels and stable symbols',
      illustrationStyle: 'none unless explicitly requested',
      copyTone: 'quiet',
      motionRhythm: 'none',
      defaultDensity: 'spacious',
      surfaceTexture: 'flat matte, stable borders, no decoration',
    },
  },
};

const DEFAULT_ACCESSIBILITY: AccessibilityProfile = {
  motion: 'reduced',
  contrast: 'standard',
  density: 'standard',
  textScale: 'standard',
  plainLanguage: false,
  sensorySafe: false,
};

const DEFAULT_DESIGN_PROFILE: UserDesignProfile = {
  archetypeId: 'hushGarden',
  accessibility: DEFAULT_ACCESSIBILITY,
  currentNeedState: 'decompression',
};

const SPACING = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

const RADIUS = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
  '2xl': 30,
  '3xl': 38,
  full: 9999,
} as const;

const FONT = {
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 21,
    '2xl': 26,
    '3xl': 34,
    '4xl': 44,
    '5xl': 56,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '800' as const,
  },
};

const MODULE = {
  mind: {
    key: 'mind',
    color: PALETTE.violet,
    bg: 'rgba(167, 139, 250, 0.12)',
    border: 'rgba(167, 139, 250, 0.32)',
    glow: 'rgba(167, 139, 250, 0.20)',
    label: 'Mind',
    purpose: 'Pattern recognition',
  },
  flow: {
    key: 'flow',
    color: PALETTE.amber,
    bg: 'rgba(255, 209, 102, 0.10)',
    border: 'rgba(255, 209, 102, 0.30)',
    glow: 'rgba(255, 209, 102, 0.18)',
    label: 'Flow',
    purpose: 'Next tiny action',
  },
  soma: {
    key: 'soma',
    color: PALETTE.soma,
    bg: 'rgba(255, 122, 182, 0.11)',
    border: 'rgba(255, 122, 182, 0.32)',
    glow: 'rgba(255, 122, 182, 0.18)',
    label: 'Body',
    purpose: 'Somatic signal',
  },
  pulse: {
    key: 'pulse',
    color: PALETTE.green,
    bg: 'rgba(116, 242, 166, 0.10)',
    border: 'rgba(116, 242, 166, 0.28)',
    glow: 'rgba(116, 242, 166, 0.16)',
    label: 'Pulse',
    purpose: 'Vital rhythm',
  },
  hub: {
    key: 'hub',
    color: PALETTE.hub,
    bg: 'rgba(116, 167, 255, 0.11)',
    border: 'rgba(116, 167, 255, 0.30)',
    glow: 'rgba(116, 167, 255, 0.18)',
    label: 'Hub',
    purpose: 'External memory',
  },
} as const;

const COLORS = {
  soma: PALETTE.soma,
  mind: PALETTE.violet,
  flow: PALETTE.amber,
  pulse: PALETTE.green,
  hub: PALETTE.hub,
  primary: PALETTE.neuro,
  primaryLight: '#B8FBFF',
  primaryDark: PALETTE.neuroDeep,
  secondary: PALETTE.violet,
  secondaryLight: '#C4B5FD',
  secondaryDark: '#6D5BD0',
  success: PALETTE.green,
  warning: PALETTE.amber,
  error: PALETTE.red,
  info: PALETTE.hub,
  pleasant: PALETTE.green,
  unpleasant: PALETTE.red,
  neutral: PALETTE.muted,
  highEnergy: PALETTE.amber,
  lowEnergy: PALETTE.hub,
  dark: {
    background: PALETTE.void,
    backgroundAlt: PALETTE.ink,
    card: PALETTE.obsidian,
    elevated: PALETTE.graphite,
    elevated2: PALETTE.graphite2,
    border: PALETTE.line,
    borderStrong: PALETTE.lineStrong,
    veil: 'rgba(5, 7, 11, 0.72)',
  },
  light: {
    background: '#F5F8FC',
    card: '#FFFFFF',
    elevated: '#EEF4FA',
    border: '#D8E3EE',
  },
  text: {
    primary: PALETTE.white,
    secondary: PALETTE.mist,
    muted: PALETTE.muted,
    dim: PALETTE.dim,
    inverse: '#061018',
  },
} as const;

function withAlpha(color: string, alpha: number) {
  if (color.startsWith('rgba')) return color;
  if (!color.startsWith('#') || color.length !== 7) return color;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function densityScale(density: DensityPreference) {
  if (density === 'compact') return 0.86;
  if (density === 'spacious') return 1.18;
  return 1;
}

function textScale(scale: AccessibilityProfile['textScale']) {
  if (scale === 'large') return 1.1;
  if (scale === 'extraLarge') return 1.22;
  return 1;
}

function getDesignTokens(profile: UserDesignProfile = DEFAULT_DESIGN_PROFILE) {
  const archetype = ARCHETYPES[profile.archetypeId] ?? ARCHETYPES.hushGarden;
  const accessibility = { ...DEFAULT_ACCESSIBILITY, ...profile.accessibility };
  const forceQuiet = accessibility.sensorySafe || accessibility.motion === 'none';
  const compactness = densityScale(accessibility.density);
  const textMultiplier = textScale(accessibility.textScale);
  const highContrast = accessibility.contrast === 'high';
  const softContrast = accessibility.contrast === 'soft';
  const palette = archetype.palette;

  const colors = {
    background: highContrast ? '#000000' : softContrast ? palette.backgroundAlt : palette.background,
    backgroundAlt: palette.backgroundAlt,
    card: highContrast ? '#0B0B0B' : palette.card,
    elevated: highContrast ? '#161616' : palette.elevated,
    elevated2: highContrast ? '#222222' : palette.elevated2,
    border: highContrast ? withAlpha('#FFFFFF', 0.34) : softContrast ? withAlpha(palette.primary, 0.1) : palette.border,
    borderStrong: highContrast ? withAlpha('#FFFFFF', 0.58) : palette.borderStrong,
    text: {
      primary: highContrast ? '#FFFFFF' : palette.textPrimary,
      secondary: highContrast ? '#F2F2F2' : palette.textSecondary,
      muted: highContrast ? '#D8D8D8' : softContrast ? palette.textSecondary : palette.textMuted,
      dim: highContrast ? '#BBBBBB' : palette.textDim,
      inverse: palette.inverse,
    },
    primary: highContrast ? '#FFFFFF' : palette.primary,
    secondary: highContrast ? '#F2F2F2' : palette.secondary,
    tertiary: highContrast ? '#DADADA' : palette.tertiary,
    glow: forceQuiet ? 'rgba(0,0,0,0)' : palette.glow,
    veil: palette.veil,
    success: PALETTE.green,
    warning: PALETTE.amber,
    error: PALETTE.red,
    info: PALETTE.hub,
  };

  const spacing = Object.fromEntries(
    Object.entries(SPACING).map(([key, value]) => [key, Math.round(value * compactness)]),
  ) as typeof SPACING;

  const font = {
    ...FONT,
    size: Object.fromEntries(
      Object.entries(FONT.size).map(([key, value]) => [key, Math.round(value * textMultiplier)]),
    ) as typeof FONT.size,
  };

  const radius = {
    ...RADIUS,
    lg: archetype.vocabulary.shape === 'precise' ? 10 : archetype.vocabulary.shape === 'quiet' ? 8 : RADIUS.lg,
    xl: archetype.vocabulary.shape === 'precise' ? 14 : archetype.vocabulary.shape === 'quiet' ? 12 : RADIUS.xl,
    '2xl': archetype.vocabulary.shape === 'precise' ? 18 : archetype.vocabulary.shape === 'quiet' ? 16 : RADIUS['2xl'],
    '3xl': archetype.vocabulary.shape === 'precise' ? 24 : archetype.vocabulary.shape === 'quiet' ? 22 : RADIUS['3xl'],
  };

  const motion = {
    pressOpacity: accessibility.motion === 'none' ? 1 : accessibility.motion === 'reduced' ? 0.9 : 0.82,
    decorative: accessibility.motion === 'full' && !accessibility.sensorySafe,
    rhythm: forceQuiet ? 'none' : archetype.vocabulary.motionRhythm,
    duration: accessibility.motion === 'full' ? 280 : accessibility.motion === 'reduced' ? 120 : 0,
  } as const;

  const shadows = {
    panel: Platform.select({
      web: { boxShadow: forceQuiet ? 'none' : `0 24px 80px ${colors.glow}` },
      default: {
        shadowColor: colors.primary,
        shadowOpacity: forceQuiet ? 0 : 0.18,
        shadowRadius: forceQuiet ? 0 : 28,
        shadowOffset: { width: 0, height: 16 },
        elevation: forceQuiet ? 0 : 8,
      },
    }),
    glow: Platform.select({
      web: { boxShadow: forceQuiet ? 'none' : `0 0 44px ${colors.glow}` },
      default: {
        shadowColor: colors.primary,
        shadowOpacity: forceQuiet ? 0 : 0.18,
        shadowRadius: forceQuiet ? 0 : 22,
        shadowOffset: { width: 0, height: 8 },
        elevation: forceQuiet ? 0 : 6,
      },
    }),
  } as const;

  return { archetype, accessibility, colors, spacing, radius, font, motion, shadows };
}

const SHADOWS = {
  panel: Platform.select({
    web: { boxShadow: '0 24px 80px rgba(0, 0, 0, 0.34)' },
    default: { shadowColor: '#000', shadowOpacity: 0.26, shadowRadius: 28, shadowOffset: { width: 0, height: 18 }, elevation: 8 },
  }),
  glow: Platform.select({
    web: { boxShadow: '0 0 44px rgba(114, 247, 255, 0.13)' },
    default: { shadowColor: COLORS.primary, shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  }),
} as const;

const MOTION = {
  pressOpacity: 0.82,
} as const;

const COPY = {
  productLine: 'A sanctuary OS for fluctuating capacity, sensory needs, memory, body signal, and next action.',
  nextTinyStep: 'One next step',
  capture: 'Capture before it disappears',
} as const;

export {
  ARCHETYPES,
  COLORS,
  COPY,
  DEFAULT_ACCESSIBILITY,
  DEFAULT_DESIGN_PROFILE,
  FONT,
  MODULE,
  MOTION,
  PALETTE,
  RADIUS,
  SHADOWS,
  SPACING,
  getDesignTokens,
  withAlpha,
};
