import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { format, parseISO } from 'date-fns';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useStore } from '@/store/useStore';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const { appointments, addAppointment } = useStore();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAddModal, setShowAddModal] = useState(false);

  const markedDates = appointments.reduce((acc, appointment) => {
    const date = appointment.date;
    acc[date] = {
      marked: true,
      dotColor: getAppointmentColor(appointment.type),
      selectedColor: Colors[colorScheme ?? 'light'].tint,
    };
    return acc;
  }, {} as any);

  const selectedDateAppointments = appointments.filter(
    apt => apt.date === selectedDate
  );

  function getAppointmentColor(type: string) {
    switch (type) {
      case 'doctor': return '#FF6B6B';
      case 'caregiver': return '#4ECDC4';
      case 'telehealth': return '#45B7D1';
      default: return '#96CEB4';
    }
  }

  function getAppointmentIcon(type: string) {
    switch (type) {
      case 'doctor': return 'stethoscope';
      case 'caregiver': return 'person.fill';
      case 'telehealth': return 'video.fill';
      default: return 'calendar';
    }
  }

  const handleAddAppointment = () => {
    Alert.prompt(
      'Add Appointment',
      'Enter appointment title:',
      (title) => {
        if (title) {
          const newAppointment = {
            id: Date.now().toString(),
            title,
            date: selectedDate,
            time: '10:00 AM',
            type: 'other' as const,
            notes: '',
          };
          addAppointment(newAppointment);
        }
      }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Calendar</ThemedText>
        <TouchableOpacity onPress={handleAddAppointment} style={styles.addButton}>
          <IconSymbol name="plus" size={24} color={Colors[colorScheme ?? 'light'].tint} />
        </TouchableOpacity>
      </ThemedView>

      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: Colors[colorScheme ?? 'light'].tint,
          }
        }}
        theme={{
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          calendarBackground: Colors[colorScheme ?? 'light'].background,
          textSectionTitleColor: Colors[colorScheme ?? 'light'].text,
          selectedDayBackgroundColor: Colors[colorScheme ?? 'light'].tint,
          selectedDayTextColor: '#ffffff',
          todayTextColor: Colors[colorScheme ?? 'light'].tint,
          dayTextColor: Colors[colorScheme ?? 'light'].text,
          textDisabledColor: Colors[colorScheme ?? 'light'].tabIconDefault,
          dotColor: Colors[colorScheme ?? 'light'].tint,
          selectedDotColor: '#ffffff',
          arrowColor: Colors[colorScheme ?? 'light'].tint,
          monthTextColor: Colors[colorScheme ?? 'light'].text,
          indicatorColor: Colors[colorScheme ?? 'light'].tint,
        }}
      />

      <ThemedView style={styles.appointmentsSection}>
        <ThemedText type="subtitle">
          Appointments for {format(parseISO(selectedDate), 'MMMM d, yyyy')}
        </ThemedText>
        
        {selectedDateAppointments.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="calendar" size={48} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            <ThemedText style={styles.emptyText}>No appointments scheduled</ThemedText>
          </ThemedView>
        ) : (
          <ScrollView style={styles.appointmentsList}>
            {selectedDateAppointments.map((appointment) => (
              <ThemedView key={appointment.id} style={styles.appointmentCard}>
                <ThemedView style={styles.appointmentHeader}>
                  <IconSymbol 
                    name={getAppointmentIcon(appointment.type)} 
                    size={20} 
                    color={getAppointmentColor(appointment.type)} 
                  />
                  <ThemedText type="defaultSemiBold" style={styles.appointmentTitle}>
                    {appointment.title}
                  </ThemedText>
                </ThemedView>
                <ThemedText style={styles.appointmentTime}>
                  {appointment.time}
                </ThemedText>
                {appointment.location && (
                  <ThemedText style={styles.appointmentLocation}>
                    📍 {appointment.location}
                  </ThemedText>
                )}
                {appointment.notes && (
                  <ThemedText style={styles.appointmentNotes}>
                    {appointment.notes}
                  </ThemedText>
                )}
              </ThemedView>
            ))}
          </ScrollView>
        )}
      </ThemedView>
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
  appointmentsSection: {
    marginTop: 20,
    flex: 1,
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
  appointmentsList: {
    marginTop: 12,
  },
  appointmentCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentTitle: {
    marginLeft: 8,
    flex: 1,
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  appointmentLocation: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  appointmentNotes: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
  },
});
