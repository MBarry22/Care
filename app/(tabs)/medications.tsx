import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, isAfter, isBefore, addDays } from 'date-fns';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useStore, Medication } from '@/store/useStore';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function MedicationsScreen() {
  const colorScheme = useColorScheme();
  const { medications, addMedication, updateMedication, removeMedication } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    times: ['8:00 AM'],
    notes: '',
  });

  const activeMedications = medications.filter(med => med.isActive);
  const upcomingDoses = getUpcomingDoses(activeMedications);

  function getUpcomingDoses(meds: Medication[]) {
    const now = new Date();
    const doses = [];
    
    meds.forEach(med => {
      med.times.forEach(time => {
        const [hours, minutes] = time.replace(/[APM]/g, '').split(':').map(Number);
        const isPM = time.includes('PM') && hours !== 12;
        const isAM = time.includes('AM') && hours === 12;
        
        let doseTime = new Date();
        doseTime.setHours(isPM ? hours + 12 : (isAM ? 0 : hours), minutes, 0, 0);
        
        if (isAfter(doseTime, now)) {
          doses.push({
            medication: med,
            time: doseTime,
            timeString: time,
          });
        }
      });
    });
    
    return doses.sort((a, b) => a.time.getTime() - b.time.getTime()).slice(0, 5);
  }

  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dosage) {
      Alert.alert('Error', 'Please fill in medication name and dosage');
      return;
    }

    const medication: Medication = {
      id: Date.now().toString(),
      name: newMedication.name,
      dosage: newMedication.dosage,
      frequency: newMedication.frequency,
      times: newMedication.times,
      notes: newMedication.notes,
      isActive: true,
    };

    addMedication(medication);
    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      times: ['8:00 AM'],
      notes: '',
    });
    setShowAddModal(false);
  };

  const handleToggleMedication = (id: string) => {
    const medication = medications.find(med => med.id === id);
    if (medication) {
      updateMedication(id, { isActive: !medication.isActive });
    }
  };

  const handleDeleteMedication = (id: string) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeMedication(id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Medications</ThemedText>
        <TouchableOpacity 
          onPress={() => setShowAddModal(true)} 
          style={styles.addButton}
        >
          <IconSymbol name="plus" size={24} color={Colors[colorScheme ?? 'light'].tint} />
        </TouchableOpacity>
      </ThemedView>

      {upcomingDoses.length > 0 && (
        <ThemedView style={styles.upcomingSection}>
          <ThemedText type="subtitle">Upcoming Doses</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.upcomingList}>
            {upcomingDoses.map((dose, index) => (
              <ThemedView key={index} style={styles.doseCard}>
                <IconSymbol name="pills.fill" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                <ThemedText style={styles.doseMedication}>{dose.medication.name}</ThemedText>
                <ThemedText style={styles.doseTime}>{dose.timeString}</ThemedText>
                <ThemedText style={styles.doseDosage}>{dose.medication.dosage}</ThemedText>
              </ThemedView>
            ))}
          </ScrollView>
        </ThemedView>
      )}

      <ThemedView style={styles.medicationsSection}>
        <ThemedText type="subtitle">All Medications</ThemedText>
        <ScrollView style={styles.medicationsList}>
          {medications.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <IconSymbol name="pills" size={48} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
              <ThemedText style={styles.emptyText}>No medications added yet</ThemedText>
            </ThemedView>
          ) : (
            medications.map((medication) => (
              <ThemedView key={medication.id} style={styles.medicationCard}>
                <ThemedView style={styles.medicationHeader}>
                  <ThemedView style={styles.medicationInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.medicationName}>
                      {medication.name}
                    </ThemedText>
                    <ThemedText style={styles.medicationDosage}>
                      {medication.dosage}
                    </ThemedText>
                    <ThemedText style={styles.medicationFrequency}>
                      {medication.frequency}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.medicationActions}>
                    <TouchableOpacity
                      onPress={() => handleToggleMedication(medication.id)}
                      style={[
                        styles.toggleButton,
                        { backgroundColor: medication.isActive ? '#4CAF50' : '#FFC107' }
                      ]}
                    >
                      <ThemedText style={styles.toggleText}>
                        {medication.isActive ? 'Active' : 'Inactive'}
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteMedication(medication.id)}
                      style={styles.deleteButton}
                    >
                      <IconSymbol name="trash" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
                
                <ThemedView style={styles.medicationTimes}>
                  <ThemedText style={styles.timesLabel}>Times:</ThemedText>
                  <ThemedView style={styles.timesList}>
                    {medication.times.map((time, index) => (
                      <ThemedView key={index} style={styles.timeTag}>
                        <ThemedText style={styles.timeText}>{time}</ThemedText>
                      </ThemedView>
                    ))}
                  </ThemedView>
                </ThemedView>
                
                {medication.notes && (
                  <ThemedText style={styles.medicationNotes}>
                    Notes: {medication.notes}
                  </ThemedText>
                )}
              </ThemedView>
            ))
          )}
        </ScrollView>
      </ThemedView>

      {showAddModal && (
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modal}>
            <ThemedText type="subtitle">Add New Medication</ThemedText>
            
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Medication name"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={newMedication.name}
              onChangeText={(text) => setNewMedication({ ...newMedication, name: text })}
            />
            
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Dosage (e.g., 10mg)"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={newMedication.dosage}
              onChangeText={(text) => setNewMedication({ ...newMedication, dosage: text })}
            />
            
            <TextInput
              style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Frequency (e.g., Once daily)"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={newMedication.frequency}
              onChangeText={(text) => setNewMedication({ ...newMedication, frequency: text })}
            />
            
            <TextInput
              style={[styles.input, styles.textArea, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Notes (optional)"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={newMedication.notes}
              onChangeText={(text) => setNewMedication({ ...newMedication, notes: text })}
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
                onPress={handleAddMedication}
                style={[styles.modalButton, styles.saveButton]}
              >
                <ThemedText style={styles.saveButtonText}>Add Medication</ThemedText>
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
  upcomingSection: {
    marginBottom: 20,
  },
  upcomingList: {
    marginTop: 12,
  },
  doseCard: {
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    minWidth: 120,
  },
  doseMedication: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  doseTime: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  doseDosage: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
  medicationsSection: {
    flex: 1,
  },
  medicationsList: {
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
  medicationCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  medicationFrequency: {
    fontSize: 14,
    opacity: 0.8,
  },
  medicationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    padding: 4,
  },
  medicationTimes: {
    marginTop: 12,
  },
  timesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  timesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeTag: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
  },
  medicationNotes: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
    marginTop: 8,
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
