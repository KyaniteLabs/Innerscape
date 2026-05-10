import type { PropsWithChildren, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ARCHETYPES, COLORS, FONT, RADIUS, SHADOWS, SPACING, type AccessibilityProfile, type NeedState, withAlpha } from '../../lib/theme';
import { useDesignTokens } from '../../hooks/useDesignTokens';
import { useDesignProfileStore } from '../../stores/designProfile';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function AppScreen({ children, scroll = true, padded = true, style, contentStyle }: ScreenProps) {
  const tokens = useDesignTokens();
  const content = <View style={[padded && { paddingHorizontal: tokens.spacing[4], paddingTop: tokens.spacing[4], paddingBottom: tokens.spacing[10] }, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: tokens.colors.background }, style]}>
      {scroll ? <ScrollView contentContainerStyle={styles.scrollContent}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

export function SanctuaryShell(props: ScreenProps) {
  const tokens = useDesignTokens();
  return (
    <AppScreen
      {...props}
      style={[{ backgroundColor: tokens.colors.background }, props.style]}
      contentStyle={[{ gap: tokens.spacing[2] }, props.contentStyle]}
    />
  );
}

interface HeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function Hero({ eyebrow, title, subtitle, right }: HeroProps) {
  const tokens = useDesignTokens();
  return (
    <View style={[styles.hero, { gap: tokens.spacing[4], marginBottom: tokens.spacing[5] }]}>
      <View style={styles.heroCopy}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: tokens.colors.primary, fontSize: tokens.font.size.xs, marginBottom: tokens.spacing[2] }]}>{eyebrow}</Text> : null}
        <Text style={[styles.heroTitle, { color: tokens.colors.text.primary, fontSize: tokens.font.size['3xl'], lineHeight: Math.round(tokens.font.size['3xl'] * 1.15) }]}>{title}</Text>
        {subtitle ? <Text style={[styles.heroSubtitle, { color: tokens.colors.text.muted, fontSize: tokens.font.size.base, lineHeight: Math.round(tokens.font.size.base * 1.45), marginTop: tokens.spacing[2] }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

interface SurfaceProps extends PropsWithChildren {
  tone?: string;
  style?: StyleProp<ViewStyle>;
}

export function Surface({ children, tone, style }: SurfaceProps) {
  const tokens = useDesignTokens();
  const accent = tone ?? tokens.colors.primary;
  return (
    <View
      style={[
        styles.surface,
        {
          backgroundColor: tokens.colors.card,
          borderColor: withAlpha(accent, tokens.accessibility.contrast === 'high' ? 0.5 : 0.24),
          borderRadius: tokens.radius['2xl'],
          padding: tokens.spacing[5],
          ...(tokens.shadows.panel as object),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function StateAwareSurface({ children, tone, style }: SurfaceProps) {
  const tokens = useDesignTokens();
  return (
    <Surface
      tone={tone}
      style={[
        {
          backgroundColor: tokens.accessibility.sensorySafe ? tokens.colors.card : withAlpha(tokens.colors.primary, 0.08),
        },
        style,
      ]}
    >
      {children}
    </Surface>
  );
}

interface SectionProps extends PropsWithChildren {
  title: string;
  action?: ReactNode;
  caption?: string;
  style?: ViewStyle;
}

export function Section({ title, caption, action, children, style }: SectionProps) {
  const tokens = useDesignTokens();
  return (
    <View style={[{ marginTop: tokens.spacing[5] }, style]}>
      <View style={[styles.sectionHeader, { gap: tokens.spacing[4], marginBottom: tokens.spacing[3] }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text.primary, fontSize: tokens.font.size.xl }]}>{title}</Text>
          {caption ? <Text style={[styles.sectionCaption, { color: tokens.colors.text.dim, fontSize: tokens.font.size.sm }]}>{caption}</Text> : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

interface CTAProps extends PropsWithChildren {
  onPress: () => void;
  disabled?: boolean;
  tone?: string;
  variant?: 'primary' | 'quiet';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function CTA({ children, onPress, disabled, tone, variant = 'primary', style, textStyle }: CTAProps) {
  const tokens = useDesignTokens();
  const accent = tone ?? tokens.colors.primary;
  return (
    <TouchableOpacity
      style={[
        styles.cta,
        {
          minHeight: 54,
          borderRadius: tokens.radius.full,
          paddingHorizontal: tokens.spacing[5],
          ...(tokens.shadows.glow as object),
        },
        variant === 'quiet'
          ? { backgroundColor: tokens.colors.elevated, borderWidth: 1, borderColor: tokens.colors.border }
          : { backgroundColor: accent },
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={tokens.motion.pressOpacity}
      disabled={disabled}
      onPress={onPress}
    >
      <Text style={[styles.ctaText, { color: variant === 'primary' ? tokens.colors.text.inverse : tokens.colors.text.primary, fontSize: tokens.font.size.base }, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

export function GentleActionButton(props: CTAProps) {
  return <CTA {...props} variant={props.variant ?? 'quiet'} />;
}

interface PillProps {
  label: string;
  active?: boolean;
  tone?: string;
  onPress?: () => void;
}

export function Pill({ label, active, tone, onPress }: PillProps) {
  const tokens = useDesignTokens();
  const accent = tone ?? tokens.colors.primary;
  const body = (
    <View
      style={[
        styles.pill,
        {
          borderColor: active ? accent : tokens.colors.border,
          backgroundColor: active ? withAlpha(accent, 0.16) : tokens.colors.elevated,
          paddingHorizontal: tokens.spacing[3],
          borderRadius: tokens.radius.full,
        },
      ]}
    >
      <Text style={[styles.pillText, { color: active ? accent : tokens.colors.text.muted, fontSize: tokens.font.size.xs }]}>{label}</Text>
    </View>
  );
  if (!onPress) return body;
  return <TouchableOpacity activeOpacity={tokens.motion.pressOpacity} onPress={onPress}>{body}</TouchableOpacity>;
}

interface MetricProps {
  label: string;
  value: string | number;
  tone?: string;
}

export function Metric({ label, value, tone }: MetricProps) {
  const tokens = useDesignTokens();
  const accent = tone ?? tokens.colors.primary;
  return (
    <View style={[styles.metric, { backgroundColor: tokens.colors.elevated, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, padding: tokens.spacing[3] }]}>
      <Text style={[styles.metricValue, { color: accent, fontSize: tokens.font.size.xl }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: tokens.colors.text.dim, fontSize: tokens.font.size.xs }]}>{label}</Text>
    </View>
  );
}

type NeedStateCardProps = {
  needState: NeedState;
  title: string;
  description: string;
  selected?: boolean;
  onPress: () => void;
};

const NEED_STATE_LABELS: Record<NeedState, string> = {
  decompression: 'Decompression',
  clarity: 'Clarity',
  activation: 'Activation',
  reflection: 'Reflection',
  play: 'Play',
  sensorySafety: 'Sensory safety',
};

export function NeedStateCard({ needState, title, description, selected, onPress }: NeedStateCardProps) {
  const tokens = useDesignTokens();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={tokens.motion.pressOpacity}
      style={[
        styles.needCard,
        {
          width: '48%',
          flexBasis: '48%',
          backgroundColor: selected ? withAlpha(tokens.colors.primary, 0.14) : tokens.colors.card,
          borderColor: selected ? tokens.colors.primary : tokens.colors.border,
          borderRadius: tokens.radius['2xl'],
          padding: tokens.spacing[4],
        },
      ]}
    >
      <Text style={[styles.needKicker, { color: tokens.colors.primary, fontSize: tokens.font.size.xs }]}>{NEED_STATE_LABELS[needState]}</Text>
      <Text style={[styles.needTitle, { color: tokens.colors.text.primary, fontSize: tokens.font.size.lg }]}>{title}</Text>
      <Text style={[styles.needDesc, { color: tokens.colors.text.muted, fontSize: tokens.font.size.sm }]}>{description}</Text>
    </TouchableOpacity>
  );
}

type CapacityCheckInProps = {
  onSelectNeedState?: (needState: NeedState) => void;
};

const NEED_OPTIONS: Array<{ needState: NeedState; title: string; description: string }> = [
  { needState: 'decompression', title: 'Lower the volume', description: 'I need fewer signals and a softer way back in.' },
  { needState: 'clarity', title: 'Make the next choice visible', description: 'I need structure, plain language, and clean hierarchy.' },
  { needState: 'activation', title: 'Help me start', description: 'I need energy, direction, and a first small win.' },
  { needState: 'reflection', title: 'Hold the feeling safely', description: 'I need space to name, write, and process.' },
  { needState: 'play', title: 'Let me explore', description: 'I need curiosity, novelty, and low-stakes experimentation.' },
  { needState: 'sensorySafety', title: 'Make it predictable', description: 'I need low motion, stable layout, and minimal surprise.' },
];

export function CapacityCheckIn({ onSelectNeedState }: CapacityCheckInProps) {
  const profile = useDesignProfileStore((state) => state.profile);
  const applyCalibration = useDesignProfileStore((state) => state.applyCalibration);
  const tokens = useDesignTokens();

  return (
    <Surface tone={tokens.colors.primary}>
      <Text style={[styles.panelKicker, { color: tokens.colors.primary, fontSize: tokens.font.size.xs }]}>Guided calibration</Text>
      <Text style={[styles.panelTitle, { color: tokens.colors.text.primary, fontSize: tokens.font.size['2xl'] }]}>What does your nervous system need right now?</Text>
      <Text style={[styles.panelCopy, { color: tokens.colors.text.muted, fontSize: tokens.font.size.base }]}>Pick a state. Innerscape will choose a visual world and accessibility defaults you can change later.</Text>
      <View style={[styles.needGrid, { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing[3], marginTop: tokens.spacing[4] }]}>
        {NEED_OPTIONS.map((option) => (
          <NeedStateCard
            key={option.needState}
            {...option}
            selected={profile.currentNeedState === option.needState}
            onPress={() => {
              applyCalibration({ needState: option.needState });
              onSelectNeedState?.(option.needState);
            }}
          />
        ))}
      </View>
    </Surface>
  );
}

type ArchetypePickerProps = {
  compact?: boolean;
};

export function ArchetypePicker({ compact }: ArchetypePickerProps) {
  const tokens = useDesignTokens();
  const profile = useDesignProfileStore((state) => state.profile);
  const setArchetype = useDesignProfileStore((state) => state.setArchetype);

  return (
    <View style={[styles.archetypeGrid, { gap: tokens.spacing[3] }]}>
      {Object.values(ARCHETYPES).map((archetype) => {
        const active = profile.archetypeId === archetype.id;
        return (
          <TouchableOpacity
            key={archetype.id}
            activeOpacity={tokens.motion.pressOpacity}
            onPress={() => setArchetype(archetype.id)}
            style={[
              styles.archetypeCard,
              compact && styles.archetypeCardCompact,
              {
                backgroundColor: archetype.palette.card,
                borderColor: active ? archetype.palette.primary : archetype.palette.border,
                borderRadius: tokens.radius['2xl'],
                padding: tokens.spacing[4],
              },
            ]}
          >
            <View style={styles.swatchRow}>
              {[archetype.palette.primary, archetype.palette.secondary, archetype.palette.tertiary].map((color) => (
                <View key={color} style={[styles.swatch, { backgroundColor: color }]} />
              ))}
            </View>
            <Text style={[styles.archetypeName, { color: archetype.palette.textPrimary, fontSize: tokens.font.size.lg }]}>{archetype.name}</Text>
            <Text style={[styles.archetypeNeed, { color: archetype.palette.primary, fontSize: tokens.font.size.xs }]}>{archetype.needLabel}</Text>
            {!compact ? <Text style={[styles.archetypeDesc, { color: archetype.palette.textMuted, fontSize: tokens.font.size.sm }]}>{archetype.goodFor}</Text> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

type AccessibilityControlsProps = {
  compact?: boolean;
};

export function AccessibilityControls({ compact }: AccessibilityControlsProps) {
  const tokens = useDesignTokens();
  const profile = useDesignProfileStore((state) => state.profile);
  const setAccessibility = useDesignProfileStore((state) => state.setAccessibility);
  const resetDesignProfile = useDesignProfileStore((state) => state.resetDesignProfile);

  const controlRows: Array<{ label: string; key: keyof AccessibilityProfile; values: string[] }> = [
    { label: 'Motion', key: 'motion', values: ['full', 'reduced', 'none'] },
    { label: 'Contrast', key: 'contrast', values: ['soft', 'standard', 'high'] },
    { label: 'Density', key: 'density', values: ['compact', 'standard', 'spacious'] },
    { label: 'Text', key: 'textScale', values: ['standard', 'large', 'extraLarge'] },
  ];

  return (
    <Surface tone={tokens.colors.secondary} style={compact ? { padding: tokens.spacing[4] } : undefined}>
      <Text style={[styles.panelKicker, { color: tokens.colors.secondary, fontSize: tokens.font.size.xs }]}>Access controls</Text>
      {!compact ? <Text style={[styles.panelTitle, { color: tokens.colors.text.primary, fontSize: tokens.font.size.xl }]}>Override the art when your body needs it.</Text> : null}
      {controlRows.map((row) => (
        <View key={row.key} style={[styles.controlRow, { borderColor: tokens.colors.border, paddingVertical: tokens.spacing[3] }]}>
          <Text style={[styles.controlLabel, { color: tokens.colors.text.secondary, fontSize: tokens.font.size.sm }]}>{row.label}</Text>
          <View style={styles.controlPills}>
            {row.values.map((value) => (
              <Pill
                key={value}
                label={value}
                active={profile.accessibility[row.key] === value}
                tone={tokens.colors.secondary}
                onPress={() => setAccessibility({ [row.key]: value } as Partial<AccessibilityProfile>)}
              />
            ))}
          </View>
        </View>
      ))}
      <View style={[styles.toggleRow, { marginTop: tokens.spacing[3] }]}>
        <Pill label="Plain language" active={profile.accessibility.plainLanguage} tone={tokens.colors.secondary} onPress={() => setAccessibility({ plainLanguage: !profile.accessibility.plainLanguage })} />
        <Pill label="Sensory safe" active={profile.accessibility.sensorySafe} tone={tokens.colors.secondary} onPress={() => setAccessibility({ sensorySafe: !profile.accessibility.sensorySafe, motion: profile.accessibility.sensorySafe ? profile.accessibility.motion : 'none' })} />
        <Pill label="Reset" tone={tokens.colors.text.dim} onPress={resetDesignProfile} />
      </View>
    </Surface>
  );
}

type ReflectionPanelProps = PropsWithChildren<{
  title: string;
  caption?: string;
}>;

export function ReflectionPanel({ title, caption, children }: ReflectionPanelProps) {
  const tokens = useDesignTokens();
  return (
    <StateAwareSurface tone={tokens.colors.secondary}>
      <Text style={[styles.panelTitle, { color: tokens.colors.text.primary, fontSize: tokens.font.size.xl }]}>{title}</Text>
      {caption ? <Text style={[styles.panelCopy, { color: tokens.colors.text.muted, fontSize: tokens.font.size.base }]}>{caption}</Text> : null}
      {children}
    </StateAwareSurface>
  );
}

type ModuleTileProps = {
  name: string;
  purpose: string;
  description: string;
  glyph: string;
  tone: string;
  onPress: () => void;
};

export function ModuleTile({ name, purpose, description, glyph, tone, onPress }: ModuleTileProps) {
  const tokens = useDesignTokens();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={tokens.motion.pressOpacity}
      style={[
        styles.moduleTile,
        {
          borderColor: withAlpha(tone, 0.34),
          backgroundColor: withAlpha(tone, tokens.accessibility.sensorySafe ? 0.04 : 0.11),
          borderRadius: tokens.radius['2xl'],
          padding: tokens.spacing[4],
        },
      ]}
    >
      <View style={[styles.moduleGlyph, { backgroundColor: tone }]}>
        <Text style={[styles.moduleGlyphText, { color: tokens.colors.text.inverse }]}>{glyph}</Text>
      </View>
      <Text style={[styles.moduleName, { color: tone, fontSize: tokens.font.size.xl }]}>{name}</Text>
      <Text style={[styles.modulePurpose, { color: tokens.colors.text.secondary, fontSize: tokens.font.size.xs }]}>{purpose}</Text>
      <Text style={[styles.moduleDesc, { color: tokens.colors.text.muted, fontSize: tokens.font.size.sm }]}>{description}</Text>
    </TouchableOpacity>
  );
}

export { withAlpha };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.dark.background },
  scrollContent: { minHeight: '100%' },
  hero: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroCopy: { flex: 1 },
  eyebrow: { fontWeight: FONT.weight.bold, letterSpacing: 1.4, textTransform: 'uppercase' },
  heroTitle: { fontWeight: FONT.weight.black, letterSpacing: -0.8 },
  heroSubtitle: {},
  surface: { borderWidth: 1, ...(SHADOWS.panel as object) },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle: { fontWeight: FONT.weight.bold, letterSpacing: -0.3 },
  sectionCaption: { marginTop: 3 },
  cta: { alignItems: 'center', justifyContent: 'center', ...(SHADOWS.glow as object) },
  ctaText: { fontWeight: FONT.weight.bold },
  disabled: { opacity: 0.5 },
  pill: { borderWidth: 1, paddingVertical: 9 },
  pillText: { fontWeight: FONT.weight.bold, letterSpacing: 0.2, textTransform: 'capitalize' },
  metric: { flex: 1, minWidth: 72, borderWidth: 1 },
  metricValue: { fontWeight: FONT.weight.black, letterSpacing: -0.3 },
  metricLabel: { marginTop: 3 },
  panelKicker: { textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: FONT.weight.black, marginBottom: SPACING[2] },
  panelTitle: { fontWeight: FONT.weight.black, letterSpacing: -0.5, lineHeight: 31 },
  panelCopy: { lineHeight: 23, marginTop: SPACING[2] },
  needGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  needCard: { borderWidth: 1, width: '48%', minHeight: 142 },
  needKicker: { textTransform: 'uppercase', letterSpacing: 1.1, fontWeight: FONT.weight.black, marginBottom: SPACING[2] },
  needTitle: { fontWeight: FONT.weight.black, letterSpacing: -0.2 },
  needDesc: { lineHeight: 20, marginTop: SPACING[1] },
  archetypeGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  archetypeCard: { width: '48%', minHeight: 190, borderWidth: 1 },
  archetypeCardCompact: { minHeight: 128 },
  swatchRow: { flexDirection: 'row', gap: 6, marginBottom: SPACING[4] },
  swatch: { width: 22, height: 22, borderRadius: RADIUS.full },
  archetypeName: { fontWeight: FONT.weight.black, letterSpacing: -0.3 },
  archetypeNeed: { fontWeight: FONT.weight.black, textTransform: 'uppercase', letterSpacing: 1.0, marginTop: SPACING[1] },
  archetypeDesc: { lineHeight: 19, marginTop: SPACING[3] },
  controlRow: { borderBottomWidth: 1 },
  controlLabel: { fontWeight: FONT.weight.bold, marginBottom: SPACING[2] },
  controlPills: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[2] },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[2] },
  moduleTile: { width: '48%', minHeight: 188, borderWidth: 1 },
  moduleGlyph: { width: 36, height: 36, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING[4] },
  moduleGlyphText: { fontSize: FONT.size.sm, fontWeight: FONT.weight.black },
  moduleName: { fontWeight: FONT.weight.black, letterSpacing: -0.4 },
  modulePurpose: { fontWeight: FONT.weight.bold, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: SPACING[1] },
  moduleDesc: { lineHeight: 19, marginTop: SPACING[3] },
});
