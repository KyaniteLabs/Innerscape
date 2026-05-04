import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Innerscape</Text>
      <Text style={styles.subtitle}>Your executive prosthetic</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#e0e0e0',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
});
