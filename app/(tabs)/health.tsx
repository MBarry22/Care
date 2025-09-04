import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, subDays } from 'date-fns';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useStore, HealthEntry } from '@/store/useStore';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function HealthScreen() {
  const colorScheme = useColorScheme();
  const { healthEntries, addHealthEntry } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    bloodPressure: '',
    heartRate: '',
    weight: '',
    mood: 'good' as HealthEntry['mood'],
    notes: '',
  });

  const recentEntries = healthEntries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  const getMoodEmoji = (mood: HealthEntry['mood']) => {
    switch (mood) {
      case 'excellent': return '😊';
      case 'good': return '🙂';
      case 'fair': return '😐';
      case 'poor': return '😔';
      default: return '🙂';
    }
  };

  const getMoodColor = (mood: HealthEntry['mood']) => {
    switch (mood) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'fair': return '#FFC107';
      case 'poor': return '#FF5722';
      default: return '#8BC34A';
    }
  };

  const handleAddEntry = () => {
    if (!newEntry.bloodPressure && !newEntry.heartRate && !newEntry.weight) {
      Alert.alert('Error', 'Please fill in at least one health metric');
      return;
    }

    const entry: HealthEntry = {
      id: Date.now().toString(),
      date: format(new Date(), 'yyyy-MM-dd'),
      bloodPressure: newEntry.bloodPressure || undefined,
      heartRate: newEntry.heartRate ? parseInt(newEntry.heartRate) : undefined,
      weight: newEntry.weight ? parseFloat(newEntry.weight) : undefined,
      mood: newEntry.mood,
      notes: newEntry.notes,
    };

    addHealthEntry(entry);
    setNewEntry({
      bloodPressure: '',
      heartRate: '',
      weight: '',
      mood: 'good',
      notes: '',
    });
    setShowAddModal(false);
  };

  const getHealthTrend = (metric: 'heartRate' | 'weight', days: number = 7) => {
    const recentData = healthEntries
      .filter(entry => entry[metric] !== undefined)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, days);

    if (recentData.length < 2) return null;

    const latest = recentData[0][metric] as number;
    const previous = recentData[1][metric] as number;
    const trend = latest - previous;

    return {
      value: latest,
      trend: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
      change: Math.abs(trend),
    };
  };

  const heartRateTrend = getHealthTrend('heartRate');
  const weightTrend = getHealthTrend('weight');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Health Tracking</ThemedText>
        <TouchableOpacity 
          onPress={() => setShowAddModal(true)} 
          style={styles.addButton}
        >
          <IconSymbol name="plus" size={24} color={Colors[colorScheme ?? 'light'].tint} />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.content}>
        {/* Health Summary Cards */}
        <ThemedView style={styles.summarySection}>
          <ThemedText type="subtitle">Health Summary</ThemedText>
          <ThemedView style={styles.summaryCards}>
            <ThemedView style={styles.summaryCard}>
              <IconSymbol name="heart.fill" size={24} color="#FF6B6B" />
              <ThemedText style={styles.summaryLabel}>Heart Rate</ThemedText>
              {heartRateTrend ? (
                <>
                  <ThemedText style={styles.summaryValue}>{heartRateTrend.value} bpm</ThemedText>
                  <ThemedView style={styles.trendContainer}>
                    <IconSymbol 
                      name={heartRateTrend.trend === 'up' ? 'arrow.up' : heartRateTrend.trend === 'down' ? 'arrow.down' : 'minus'} 
                      size={12} 
                      color={heartRateTrend.trend === 'up' ? '#FF5722' : heartRateTrend.trend === 'down' ? '#4CAF50' : '#666'} 
                    />
                    <ThemedText style={styles.trendText}>
                      {heartRateTrend.change} from last reading
                    </ThemedText>
                  </ThemedView>
                </>
              ) : (
                <ThemedText style={styles.noDataText}>No data yet</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.summaryCard}>
              <IconSymbol name="scalemass.fill" size={24} color="#4CAF50" />
              <ThemedText style={styles.summaryLabel}>Weight</ThemedText>
              {weightTrend ? (
                <>
                  <ThemedText style={styles.summaryValue}>{weightTrend.value} lbs</ThemedText>
                  <ThemedView style={styles.trendContainer}>
                    <IconSymbol 
                      name={weightTrend.trend === 'up' ? 'arrow.up' : weightTrend.trend === 'down' ? 'arrow.down' : 'minus'} 
                      size={12} 
                      color={weightTrend.trend === 'up' ? '#FF5722' : weightTrend.trend === 'down' ? '#4CAF50' : '#666'} 
                    />
                    <ThemedText style={styles.trendText}>
                      {weightTrend.change} lbs from last reading
                    </ThemedText>
                  </ThemedView>
                </>
              ) : (
                <ThemedText style={styles.noDataText}>No data yet</ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Recent Entries */}
        <ThemedView style={styles.entriesSection}>
          <ThemedText type="subtitle">Recent Entries</ThemedText>
          {recentEntries.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <IconSymbol name="heart" size={48} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
              <ThemedText style={styles.emptyText}>No health entries yet</ThemedText>
              <ThemedText style={styles.emptySubtext}>Tap the + button to add your first entry</ThemedText>
            </ThemedView>
          ) : (
            <ScrollView style={styles.entriesList}>
              {recentEntries.map((entry) => (
                <ThemedView key={entry.id} style={styles.entryCard}>
                  <ThemedView style={styles.entryHeader}>
                    <ThemedText type="defaultSemiBold">
                      {format(new Date(entry.date), 'MMM d, yyyy')}
                    </ThemedText>
                    <ThemedView style={styles.moodIndicator}>
                      <ThemedText style={styles.moodEmoji}>
                        {getMoodEmoji(entry.mood)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  
                  <ThemedView style={styles.entryMetrics}>
                    {entry.bloodPressure && (
                      <ThemedView style={styles.metric}>
                        <ThemedText style={styles.metricLabel}>Blood Pressure</ThemedText>
                        <ThemedText style={styles.metricValue}>{entry.bloodPressure}</ThemedText>
                      </ThemedView>
                    )}
                    {entry.heartRate && (
                      <ThemedView style={styles.metric}>
                        <ThemedText style={styles.metricLabel}>Heart Rate</ThemedText>
                        <ThemedText style={styles.metricValue}>{entry.heartRate} bpm</ThemedText>
                      </ThemedView>
                    )}
                    {entry.weight && (
                      <ThemedView style={styles.metric}>
                        <ThemedText style={styles.metricLabel}>Weight</ThemedText>
                        <ThemedText style={styles.metricValue}>{entry.weight} lbs</ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                  
                  {entry.notes && (
                    <ThemedText style={styles.entryNotes}>
                      Notes: {entry.notes}
                    </ThemedText>
                  )}
                </ThemedView>
              ))}
            </ScrollView>
          )}
        </ThemedView>
      </ScrollView>

      {/* Add Entry Modal */}
      {showAddModal && (
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modal}>
            <ThemedText type="subtitle">Add Health Entry</ThemedText>
            
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Blood Pressure (e.g., 120/80)"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={newEntry.bloodPressure}
              onChangeText={(text) => setNewEntry({ ...newEntry, bloodPressure: text })}
            />
            
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Heart Rate (bpm)"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={newEntry.heartRate}
              onChangeText={(text) => setNewEntry({ ...newEntry, heartRate: text })}
              keyboardType="numeric"
            />
            
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Weight (lbs)"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={newEntry.weight}
              onChangeText={(text) => setNewEntry({ ...newEntry, weight: text })}
              keyboardType="numeric"
            />
            
            <ThemedView style={styles.moodSelector}>
              <ThemedText style={styles.moodLabel}>Mood:</ThemedText>
              <ThemedView style={styles.moodOptions}>
                {(['excellent', 'good', 'fair', 'poor'] as const).map((mood) => (
                  <TouchableOpacity
                    key={mood}
                    onPress={() => setNewEntry({ ...newEntry, mood })}
                    style={[
                      styles.moodOption,
                      newEntry.mood === mood && styles.moodOptionSelected
                    ]}
                  >
                    <ThemedText style={styles.moodOptionEmoji}>
                      {getMoodEmoji(mood)}
                    </ThemedText>
                    <ThemedText style={styles.moodOptionText}>
                      {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            </ThemedView>
            
            <TextInput
              style={[styles.input, styles.textArea, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Notes (optional)"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={newEntry.notes}
              onChangeText={(text) => setNewEntry({ ...newEntry, notes: text })}
              multiline
            />
            
            <ThemedView style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddEntry}
                style={[styles.modalButton, styles.saveButton]}
              >
                <ThemedText style={styles.saveButtonText}>Add Entry</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 10,
    marginLeft: 4,
    opacity: 0.7,
  },
  noDataText: {
    fontSize: 12,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  entriesSection: {
    flex: 1,
  },
  entriesList: {
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    opacity: 0.6,
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.5,
  },
  entryCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodIndicator: {
    padding: 4,
  },
  moodEmoji: {
    fontSize: 20,
  },
  entryMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metric: {
    marginRight: 16,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  entryNotes: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  moodSelector: {
    marginTop: 12,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    flex: 1,
    padding: 12,
    marginHorizontal: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  moodOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  moodOptionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodOptionText: {
    fontSize: 12,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
