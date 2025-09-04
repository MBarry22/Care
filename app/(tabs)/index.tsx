import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, isToday, isAfter, isBefore } from 'date-fns';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useStore } from '@/store/useStore';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { initializeDemoData } from '@/utils/demoData';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const { user, logout } = useAuth();
  const { 
    currentUser, 
    medications, 
    appointments, 
    healthEntries, 
    messages,
    setCurrentUser 
  } = useStore();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Initialize demo data if store is empty
    const store = useStore.getState();
    if (store.medications.length === 0) {
      initializeDemoData(store);
    }

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const activeMedications = medications.filter(med => med.isActive);
  const todayAppointments = appointments.filter(apt => apt.date === format(new Date(), 'yyyy-MM-dd'));
  const unreadMessages = messages.filter(msg => !msg.isRead);
  const recentHealthEntry = healthEntries.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  const upcomingMedications = activeMedications.flatMap(med => 
    med.times.map(time => ({
      medication: med,
      time,
      nextDose: getNextDoseTime(time),
    }))
  ).filter(dose => isAfter(dose.nextDose, currentTime))
   .sort((a, b) => a.nextDose.getTime() - b.nextDose.getTime())
   .slice(0, 3);

  function getNextDoseTime(timeString: string) {
    const [hours, minutes] = timeString.replace(/[APM]/g, '').split(':').map(Number);
    const isPM = timeString.includes('PM') && hours !== 12;
    const isAM = timeString.includes('AM') && hours === 12;
    
    const doseTime = new Date();
    doseTime.setHours(isPM ? hours + 12 : (isAM ? 0 : hours), minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (isBefore(doseTime, currentTime)) {
      doseTime.setDate(doseTime.getDate() + 1);
    }
    
    return doseTime;
  }

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Contact',
      'Calling emergency services...',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', style: 'destructive', onPress: () => {
          // In a real app, this would initiate an emergency call
          Alert.alert('Emergency', 'Emergency services have been contacted');
        }},
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedView style={styles.greetingSection}>
          <ThemedText type="title">{getGreeting()}, {user?.name || 'User'}!</ThemedText>
          <ThemedText style={styles.timeText}>
            {format(currentTime, 'EEEE, MMMM d, yyyy • h:mm a')}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.headerButtons}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={Colors[colorScheme ?? 'light'].tint} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEmergencyCall} style={styles.emergencyButton}>
            <IconSymbol name="phone.fill" size={24} color="#fff" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Quick Stats */}
      <ThemedView style={styles.statsSection}>
        <ThemedView style={styles.statCard}>
          <IconSymbol name="pills.fill" size={24} color="#4CAF50" />
          <ThemedText style={styles.statNumber}>{activeMedications.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Active Medications</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statCard}>
          <IconSymbol name="calendar" size={24} color="#2196F3" />
          <ThemedText style={styles.statNumber}>{todayAppointments.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Today's Appointments</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statCard}>
          <IconSymbol name="message.fill" size={24} color="#FF9800" />
          <ThemedText style={styles.statNumber}>{unreadMessages.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Unread Messages</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Upcoming Medications */}
      {upcomingMedications.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Next Medication Doses</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.medicationList}>
            {upcomingMedications.map((dose, index) => (
              <ThemedView key={index} style={styles.medicationCard}>
                <IconSymbol name="pills.fill" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                <ThemedText style={styles.medicationName}>{dose.medication.name}</ThemedText>
                <ThemedText style={styles.medicationTime}>{dose.time}</ThemedText>
                <ThemedText style={styles.medicationDosage}>{dose.medication.dosage}</ThemedText>
              </ThemedView>
            ))}
          </ScrollView>
        </ThemedView>
      )}

      {/* Today's Appointments */}
      {todayAppointments.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Today's Appointments</ThemedText>
          {todayAppointments.map((appointment) => (
            <ThemedView key={appointment.id} style={styles.appointmentCard}>
              <ThemedView style={styles.appointmentHeader}>
                <IconSymbol 
                  name={appointment.type === 'doctor' ? 'stethoscope' : 
                        appointment.type === 'caregiver' ? 'person.fill' : 'calendar'} 
                  size={20} 
                  color={Colors[colorScheme ?? 'light'].tint} 
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
            </ThemedView>
          ))}
        </ThemedView>
      )}

      {/* Recent Health Entry */}
      {recentHealthEntry && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Latest Health Update</ThemedText>
          <ThemedView style={styles.healthCard}>
            <ThemedView style={styles.healthHeader}>
              <ThemedText type="defaultSemiBold">
                {format(new Date(recentHealthEntry.date), 'MMM d, yyyy')}
              </ThemedText>
              <ThemedText style={styles.moodEmoji}>
                {recentHealthEntry.mood === 'excellent' ? '😊' :
                 recentHealthEntry.mood === 'good' ? '🙂' :
                 recentHealthEntry.mood === 'fair' ? '😐' : '😔'}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.healthMetrics}>
              {recentHealthEntry.bloodPressure && (
                <ThemedText style={styles.healthMetric}>
                  BP: {recentHealthEntry.bloodPressure}
                </ThemedText>
              )}
              {recentHealthEntry.heartRate && (
                <ThemedText style={styles.healthMetric}>
                  HR: {recentHealthEntry.heartRate} bpm
                </ThemedText>
              )}
              {recentHealthEntry.weight && (
                <ThemedText style={styles.healthMetric}>
                  Weight: {recentHealthEntry.weight} lbs
                </ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>
      )}

      {/* Quick Actions */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Quick Actions</ThemedText>
        <ThemedView style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <IconSymbol name="plus" size={24} color={Colors[colorScheme ?? 'light'].tint} />
            <ThemedText style={styles.actionText}>Add Medication</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <IconSymbol name="calendar" size={24} color={Colors[colorScheme ?? 'light'].tint} />
            <ThemedText style={styles.actionText}>Schedule Appointment</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <IconSymbol name="heart.fill" size={24} color={Colors[colorScheme ?? 'light'].tint} />
            <ThemedText style={styles.actionText}>Log Health Data</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <IconSymbol name="message.fill" size={24} color={Colors[colorScheme ?? 'light'].tint} />
            <ThemedText style={styles.actionText}>Send Message</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
      </ScrollView>
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
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greetingSection: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
    marginRight: 8,
  },
  timeText: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  emergencyButton: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 24,
    marginLeft: 16,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  medicationList: {
    marginTop: 12,
  },
  medicationCard: {
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    minWidth: 120,
  },
  medicationName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  medicationTime: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  medicationDosage: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
  appointmentCard: {
    padding: 16,
    marginTop: 12,
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
  },
  healthCard: {
    padding: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodEmoji: {
    fontSize: 24,
  },
  healthMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  healthMetric: {
    fontSize: 14,
    marginRight: 16,
    marginBottom: 4,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    width: '48%',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});
