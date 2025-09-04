import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'senior' | 'family' | 'caregiver';
  avatar?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  notes?: string;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'doctor' | 'caregiver' | 'telehealth' | 'other';
  location?: string;
  notes?: string;
  caregiverId?: string;
}

export interface HealthEntry {
  id: string;
  date: string;
  bloodPressure?: string;
  heartRate?: number;
  weight?: number;
  mood: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Caregiver {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  avatar?: string;
  isAvailable: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

interface SeniorCareStore {
  // User state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  // Family members
  familyMembers: User[];
  addFamilyMember: (member: User) => void;
  removeFamilyMember: (id: string) => void;
  
  // Medications
  medications: Medication[];
  addMedication: (medication: Medication) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  removeMedication: (id: string) => void;
  
  // Appointments
  appointments: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  removeAppointment: (id: string) => void;
  
  // Health tracking
  healthEntries: HealthEntry[];
  addHealthEntry: (entry: HealthEntry) => void;
  updateHealthEntry: (id: string, updates: Partial<HealthEntry>) => void;
  
  // Messages
  messages: Message[];
  addMessage: (message: Message) => void;
  markMessageAsRead: (id: string) => void;
  
  // Caregivers
  caregivers: Caregiver[];
  setCaregivers: (caregivers: Caregiver[]) => void;
  
  // Emergency contacts
  emergencyContacts: EmergencyContact[];
  addEmergencyContact: (contact: EmergencyContact) => void;
  removeEmergencyContact: (id: string) => void;
  
  // Subscription
  subscriptionTier: 'basic' | 'plus' | 'premium';
  setSubscriptionTier: (tier: 'basic' | 'plus' | 'premium') => void;
}

export const useStore = create<SeniorCareStore>()(
  persist(
    (set, get) => ({
      // User state
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      
      // Family members
      familyMembers: [],
      addFamilyMember: (member) => set((state) => ({
        familyMembers: [...state.familyMembers, member]
      })),
      removeFamilyMember: (id) => set((state) => ({
        familyMembers: state.familyMembers.filter(member => member.id !== id)
      })),
      
      // Medications
      medications: [],
      addMedication: (medication) => set((state) => ({
        medications: [...state.medications, medication]
      })),
      updateMedication: (id, updates) => set((state) => ({
        medications: state.medications.map(med => 
          med.id === id ? { ...med, ...updates } : med
        )
      })),
      removeMedication: (id) => set((state) => ({
        medications: state.medications.filter(med => med.id !== id)
      })),
      
      // Appointments
      appointments: [],
      addAppointment: (appointment) => set((state) => ({
        appointments: [...state.appointments, appointment]
      })),
      updateAppointment: (id, updates) => set((state) => ({
        appointments: state.appointments.map(apt => 
          apt.id === id ? { ...apt, ...updates } : apt
        )
      })),
      removeAppointment: (id) => set((state) => ({
        appointments: state.appointments.filter(apt => apt.id !== id)
      })),
      
      // Health tracking
      healthEntries: [],
      addHealthEntry: (entry) => set((state) => ({
        healthEntries: [...state.healthEntries, entry]
      })),
      updateHealthEntry: (id, updates) => set((state) => ({
        healthEntries: state.healthEntries.map(entry => 
          entry.id === id ? { ...entry, ...updates } : entry
        )
      })),
      
      // Messages
      messages: [],
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),
      markMessageAsRead: (id) => set((state) => ({
        messages: state.messages.map(msg => 
          msg.id === id ? { ...msg, isRead: true } : msg
        )
      })),
      
      // Caregivers
      caregivers: [],
      setCaregivers: (caregivers) => set({ caregivers }),
      
      // Emergency contacts
      emergencyContacts: [],
      addEmergencyContact: (contact) => set((state) => ({
        emergencyContacts: [...state.emergencyContacts, contact]
      })),
      removeEmergencyContact: (id) => set((state) => ({
        emergencyContacts: state.emergencyContacts.filter(contact => contact.id !== id)
      })),
      
      // Subscription
      subscriptionTier: 'basic',
      setSubscriptionTier: (tier) => set({ subscriptionTier: tier }),
    }),
    {
      name: 'seniorcare-storage',
    }
  )
);
