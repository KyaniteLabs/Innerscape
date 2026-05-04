import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';

// In production, this would fetch from the backend or local PowerSync DB
const fetchMood = async () => {
  // const res = await fetch('https://api.innerscape.app/feelings/recent');
  // return res.json();
  return { 
    energy: 'High', 
    valence: 'Pleasant', 
    dominantFeeling: '😊 Joy',
    bodySensation: 'Warmth in chest'
  };
};

export const EmotionalContextBanner = () => {
  const { data: mood, isLoading } = useQuery({
    queryKey: ['mood'],
    queryFn: fetchMood
  });

  if (isLoading || !mood) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Currently: <Text style={styles.bold}>{mood.energy} Energy, {mood.valence}</Text> ({mood.dominantFeeling})
      </Text>
      {mood.bodySensation && (
        <Text style={styles.subtext}>Sensation: {mood.bodySensation}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#EEF2FF', // light indigo
    borderBottomWidth: 1,
    borderBottomColor: '#E0E7FF',
  },
  text: {
    fontSize: 14,
    color: '#3730A3', // dark indigo
  },
  bold: {
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 12,
    color: '#4F46E5',
    marginTop: 2,
  }
});
