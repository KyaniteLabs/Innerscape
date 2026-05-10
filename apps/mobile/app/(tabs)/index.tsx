import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { QuickCheckIn } from '../../components/checkin/QuickCheckIn';
import { useDailySummary } from '../../hooks/useReview';
import {
  AccessibilityControls,
  ArchetypePicker,
  CapacityCheckIn,
  CTA,
  Hero,
  Metric,
  ModuleTile,
  Pill,
  ReflectionPanel,
  SanctuaryShell,
  Section,
  StateAwareSurface,
  Surface,
  withAlpha,
} from '../../components/design/System';
import { COPY, MODULE, type NeedState } from '../../lib/theme';
import { useDesignTokens } from '../../hooks/useDesignTokens';
import { useDesignProfileStore } from '../../stores/designProfile';

const MODULES = [
  { name: 'Mind', signal: MODULE.mind, desc: 'Name patterns without turning your feelings into homework.', tab: '/(tabs)/mind', glyph: 'M' },
  { name: 'Flow', signal: MODULE.flow, desc: 'Find the first action small enough to start now.', tab: '/(tabs)/flow', glyph: 'F' },
  { name: 'Body', signal: MODULE.soma, desc: 'Translate body signal into usable context.', tab: '/(tabs)/body', glyph: 'B' },
  { name: 'Hub', signal: MODULE.hub, desc: 'Catch open loops before working memory drops them.', tab: '/(tabs)/hub', glyph: 'H' },
];

const RIGHT_NOW: Record<NeedState, { title: string; text: string; action: string; route: Parameters<typeof router.push>[0] }> = {
  decompression: {
    title: 'Lower the volume first.',
    text: 'The app is in Hush Garden: fewer signals, softer contrast, and no demand to explain yourself.',
    action: 'Open Body scan',
    route: '/(tabs)/body',
  },
  clarity: {
    title: 'Make one decision visible.',
    text: 'The app is in Clear Studio: clean structure, direct wording, and choices kept under control.',
    action: 'Open Flow',
    route: '/(tabs)/flow',
  },
  activation: {
    title: 'Start before the plan gets huge.',
    text: 'The app is in Spark Current: brighter hierarchy and a clear first step for initiation drag.',
    action: 'Choose first action',
    route: '/(tabs)/flow',
  },
  reflection: {
    title: 'Hold the feeling safely.',
    text: 'The app is in Moon Room: slower surfaces for naming, journaling, and emotional processing.',
    action: 'Open journal',
    route: '/(tabs)/mind',
  },
  play: {
    title: 'Experiment without pressure.',
    text: 'The app is in Play Lab: tactile, modular, and curious enough to make exploration feel safe.',
    action: 'Open Hub',
    route: '/(tabs)/hub',
  },
  sensorySafety: {
    title: 'Keep everything predictable.',
    text: 'The app is in Quiet Signal: low motion, stable layout, and minimal surprise.',
    action: 'Open Hub',
    route: '/(tabs)/hub',
  },
};

export default function HomeScreen() {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInComplete, setCheckInComplete] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const { data: dailySummary } = useDailySummary();
  const tokens = useDesignTokens();
  const profile = useDesignProfileStore((s) => s.profile);
  const hasCompletedCalibration = useDesignProfileStore((s) => s.hasCompletedCalibration);
  const setCurrentNeedState = useDesignProfileStore((s) => s.setCurrentNeedState);
  const rightNow = RIGHT_NOW[profile.currentNeedState ?? tokens.archetype.needState];

  const handleCheckInComplete = () => {
    setCheckInComplete(true);
    setTimeout(() => {
      setShowCheckIn(false);
      setCheckInComplete(false);
    }, 1300);
  };

  return (
    <SanctuaryShell>
      <Hero
        eyebrow="Innerscape"
        title={tokens.accessibility.plainLanguage ? 'A space that adapts to your needs.' : 'Your sanctuary OS, tuned to your nervous system.'}
        subtitle={COPY.productLine}
        right={
          <View style={[styles.orb, { borderColor: tokens.colors.borderStrong, backgroundColor: tokens.colors.elevated, shadowColor: tokens.colors.primary }]}>
            <Text style={[styles.orbText, { color: tokens.colors.primary }]}>{tokens.archetype.name.split(' ').map((word) => word[0]).join('')}</Text>
          </View>
        }
      />

      <View style={styles.statusRail}>
        <Pill label={tokens.archetype.name} active />
        <Pill label={tokens.archetype.needLabel} active tone={tokens.colors.secondary} />
        <Pill label={tokens.accessibility.sensorySafe ? 'Sensory safe on' : `${tokens.accessibility.motion} motion`} tone={tokens.colors.tertiary} />
      </View>

      {!hasCompletedCalibration ? (
        <CapacityCheckIn />
      ) : (
        <StateAwareSurface tone={tokens.colors.primary}>
          <Text style={[styles.cardKicker, { color: tokens.colors.primary, fontSize: tokens.font.size.xs }]}>Right now</Text>
          <Text style={[styles.nextTitle, { color: tokens.colors.text.primary, fontSize: tokens.font.size['2xl'], lineHeight: Math.round(tokens.font.size['2xl'] * 1.18) }]}>{rightNow.title}</Text>
          <Text style={[styles.nextText, { color: tokens.colors.text.muted, fontSize: tokens.font.size.base, lineHeight: Math.round(tokens.font.size.base * 1.45) }]}>{rightNow.text}</Text>
          <View style={[styles.actionRow, { gap: tokens.spacing[3], marginTop: tokens.spacing[4] }]}>
            <CTA onPress={() => router.push(rightNow.route)} tone={tokens.colors.primary} style={styles.primaryAction}>{rightNow.action}</CTA>
            <CTA onPress={() => setShowCustomization((value) => !value)} variant="quiet" style={styles.secondaryAction}>{showCustomization ? 'Hide controls' : 'Tune space'}</CTA>
          </View>
        </StateAwareSurface>
      )}

      {showCheckIn && !checkInComplete ? (
        <QuickCheckIn on_complete={handleCheckInComplete} />
      ) : checkInComplete ? (
        <Surface tone={tokens.colors.success}>
          <Text style={[styles.confirmationKicker, { color: tokens.colors.success }]}>State saved</Text>
          <Text style={[styles.confirmationText, { color: tokens.colors.text.primary }]}>The interface can adapt now.</Text>
        </Surface>
      ) : (
        <CTA onPress={() => setShowCheckIn(true)} variant="quiet" style={styles.checkInButton}>
          Run 10-second capacity scan
        </CTA>
      )}

      {showCustomization ? (
        <>
          <Section title="Choose a visual world" caption="Six need-state archetypes. Each is a complete constrained art direction, not a skin.">
            <ArchetypePicker />
          </Section>
          <Section title="Accessibility overrides" caption="The art always yields to your body.">
            <AccessibilityControls />
          </Section>
        </>
      ) : null}

      <Section title="Need state shortcuts" caption="Change the interface by what your brain/body needs now.">
        <View style={[styles.needShortcutGrid, { gap: tokens.spacing[2] }]}>
          {([
            ['decompression', 'Calm'],
            ['clarity', 'Clarity'],
            ['activation', 'Start'],
            ['reflection', 'Feel'],
            ['play', 'Play'],
            ['sensorySafety', 'Safe'],
          ] as Array<[NeedState, string]>).map(([needState, label]) => (
            <TouchableOpacity
              key={needState}
              onPress={() => setCurrentNeedState(needState)}
              activeOpacity={tokens.motion.pressOpacity}
              style={[
                styles.needShortcut,
                {
                  backgroundColor: profile.currentNeedState === needState ? withAlpha(tokens.colors.primary, 0.18) : tokens.colors.card,
                  borderColor: profile.currentNeedState === needState ? tokens.colors.primary : tokens.colors.border,
                  borderRadius: tokens.radius.full,
                  paddingVertical: tokens.spacing[3],
                },
              ]}
            >
              <Text style={[styles.needShortcutText, { color: profile.currentNeedState === needState ? tokens.colors.primary : tokens.colors.text.secondary, fontSize: tokens.font.size.sm }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      <Section title="Three choices only" caption="The home surface refuses to become a cluttered dashboard.">
        <View style={[styles.choiceGrid, { gap: tokens.spacing[3] }]}>
          <ReflectionPanel title="1. Regulate" caption="Body, sleep, space, and somatic signals." />
          <ReflectionPanel title="2. Begin" caption="The smallest next action, not a life overhaul." />
          <ReflectionPanel title="3. Capture" caption="External memory before the thought disappears." />
        </View>
      </Section>

      {dailySummary && dailySummary.totalActivity > 0 ? (
        <Section title="Today’s signal" caption="Progress without shame, pressure, or fake streak anxiety.">
          <View style={[styles.metricRow, { gap: tokens.spacing[2] }]}>
            <Metric label="Check-ins" value={dailySummary.emotionalCheckIns} tone={MODULE.soma.color} />
            <Metric label="Habits" value={dailySummary.habitsCompleted} tone={MODULE.flow.color} />
            <Metric label="Tasks" value={dailySummary.tasksCompleted} tone={tokens.colors.success} />
            <Metric label="Captures" value={dailySummary.itemsCaptured} tone={MODULE.hub.color} />
          </View>
        </Section>
      ) : null}

      <Section title="Core supports" caption="The modules stay familiar while the visual language adapts around them.">
        <View style={[styles.moduleGrid, { gap: tokens.spacing[3] }]}>
          {MODULES.map((module) => (
            <ModuleTile
              key={module.name}
              name={module.name}
              purpose={module.signal.purpose}
              description={module.desc}
              glyph={module.glyph}
              tone={module.signal.color}
              onPress={() => router.push(module.tab as Parameters<typeof router.push>[0])}
            />
          ))}
        </View>
      </Section>

      <Text style={[styles.footerNote, { color: tokens.colors.text.dim, fontSize: tokens.font.size.xs }]}>Visual vocabulary: {tokens.archetype.vocabulary.surfaceTexture}. Copy tone: {tokens.archetype.vocabulary.copyTone}. Motion: {tokens.motion.rhythm}.</Text>
    </SanctuaryShell>
  );
}

const styles = StyleSheet.create({
  orb: { width: 60, height: 60, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  orbText: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  statusRail: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  checkInButton: { marginTop: 12 },
  confirmationKicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  confirmationText: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  cardKicker: { textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800', marginBottom: 8 },
  nextTitle: { fontWeight: '800', letterSpacing: -0.5 },
  nextText: { marginTop: 10 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap' },
  primaryAction: { flexGrow: 1 },
  secondaryAction: { flexGrow: 1 },
  needShortcutGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  needShortcut: { borderWidth: 1, paddingHorizontal: 14, minWidth: '30%', alignItems: 'center' },
  needShortcutText: { fontWeight: '800' },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  metricRow: { flexDirection: 'row', flexWrap: 'wrap' },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  footerNote: { lineHeight: 18, marginTop: 24, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: '700' },
});
