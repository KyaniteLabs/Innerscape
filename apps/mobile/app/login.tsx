import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { login, register } from '../lib/auth';
import { useAuthStore } from '../stores/auth';

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
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.container}>
          <Text style={styles.title}>{isRegister ? 'Create Account' : 'Welcome Back'}</Text>
          <Text style={styles.subtitle}>
            {isRegister ? 'Start your Innerscape journey' : 'Sign in to continue'}
          </Text>

          {isRegister && (
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#555"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !email || !password}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.switchLink}>{isRegister ? 'Sign In' : 'Sign Up'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f0f23' },
  flex: { flex: 1 },
  container: { paddingHorizontal: 24, paddingTop: 32 },
  title: { color: '#e0e0e0', fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#666', fontSize: 15, marginTop: 4, marginBottom: 32 },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 14,
    color: '#e0e0e0',
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#6c63ff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switchRow: { marginTop: 24, alignItems: 'center' },
  switchText: { color: '#666', fontSize: 14 },
  switchLink: { color: '#6c63ff', fontWeight: '600' },
});
