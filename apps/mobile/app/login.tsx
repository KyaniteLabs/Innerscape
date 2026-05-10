import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { login, register } from '../lib/auth';
import { useAuthStore } from '../stores/auth';
import { AppScreen, CTA, Hero, Surface } from '../components/design/System';
import { COLORS, FONT, RADIUS, SPACING } from '../lib/theme';

export default function LoginScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);

    try {
      const res = isRegister ? await register(email, password, name) : await login(email, password);
      setUser(res.user);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.body?.error || err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen scroll={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <Hero
          eyebrow="Secure sync"
          title={isRegister ? 'Build your cognitive environment.' : 'Return to your field.'}
          subtitle={isRegister ? 'Your patterns, captures, and body signals stay connected across devices.' : 'Sign in to restore memory, context, and continuity.'}
        />

        <Surface style={styles.card}>
          {isRegister && (
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor={COLORS.text.dim} value={name} onChangeText={setName} autoCapitalize="words" />
          )}
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={COLORS.text.dim} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor={COLORS.text.dim} value={password} onChangeText={setPassword} secureTextEntry />
          <CTA onPress={handleSubmit} disabled={loading || !email || !password} style={styles.button}>
            {loading ? 'Opening field…' : isRegister ? 'Create account' : 'Sign in'}
          </CTA>
        </Surface>

        <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.switchRow} activeOpacity={0.82}>
          <Text style={styles.switchText}>
            {isRegister ? 'Already have continuity? ' : 'New here? '}
            <Text style={styles.switchLink}>{isRegister ? 'Sign in' : 'Create an account'}</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'center' },
  card: { gap: SPACING[3] },
  input: { backgroundColor: COLORS.dark.elevated, borderWidth: 1, borderColor: COLORS.dark.border, borderRadius: RADIUS.lg, padding: 15, color: COLORS.text.primary, fontSize: FONT.size.base },
  button: { marginTop: SPACING[2] },
  switchRow: { marginTop: SPACING[6], alignItems: 'center' },
  switchText: { color: COLORS.text.muted, fontSize: FONT.size.sm },
  switchLink: { color: COLORS.primary, fontWeight: FONT.weight.bold },
});
