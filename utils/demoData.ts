import { Medication, Appointment, HealthEntry, Message, Caregiver, EmergencyContact } from '@/store/useStore';

export const demoMedications: Medication[] = [
  {
    id: '1',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    times: ['8:00 AM'],
    notes: 'Take with breakfast',
    isActive: true,
  },
  {
    id: '2',
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    times: ['8:00 AM', '6:00 PM'],
    notes: 'Take with meals',
    isActive: true,
  },
  {
    id: '3',
    name: 'Vitamin D',
    dosage: '1000 IU',
    frequency: 'Once daily',
    times: ['9:00 AM'],
    notes: 'Take with food',
    isActive: true,
  },
];

export const demoAppointments: Appointment[] = [
  {
    id: '1',
    title: 'Dr. Smith - Annual Checkup',
    date: new Date().toISOString().split('T')[0],
    time: '2:00 PM',
    type: 'doctor',
    location: 'Vancouver General Hospital',
    notes: 'Bring medication list',
  },
  {
    id: '2',
    title: 'Maria - Caregiver Visit',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '10:00 AM',
    type: 'caregiver',
    location: 'Home',
    notes: 'Help with grocery shopping',
    caregiverId: '1',
  },
  {
    id: '3',
    title: 'Telehealth - Cardiology',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '11:30 AM',
    type: 'telehealth',
    notes: 'Review heart medication',
  },
];

export const demoHealthEntries: HealthEntry[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    bloodPressure: '120/80',
    heartRate: 72,
    weight: 145,
    mood: 'good',
    notes: 'Feeling well today, good energy',
  },
  {
    id: '2',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    bloodPressure: '118/78',
    heartRate: 68,
    weight: 144.5,
    mood: 'excellent',
    notes: 'Great day, went for a walk',
  },
  {
    id: '3',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    bloodPressure: '125/82',
    heartRate: 75,
    weight: 145.2,
    mood: 'fair',
    notes: 'Tired today, stayed home',
  },
];

export const demoMessages: Message[] = [
  {
    id: '1',
    senderId: '2',
    senderName: 'Sarah Johnson',
    content: 'Hi Mom! How are you feeling today? Don\'t forget your 2 PM appointment with Dr. Smith.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: '2',
    senderId: '3',
    senderName: 'Dr. Smith',
    content: 'Your blood pressure looks good. Please continue taking your medication as prescribed.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: '3',
    senderId: '4',
    senderName: 'Maria Garcia',
    content: 'I\'ll be there tomorrow at 10 AM to help with groceries. Is there anything specific you need?',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
];

export const demoCaregivers: Caregiver[] = [
  {
    id: '1',
    name: 'Maria Garcia',
    specialty: 'Personal Care',
    rating: 4.8,
    avatar: '👩‍🦱',
    isAvailable: true,
  },
  {
    id: '2',
    name: 'John Wilson',
    specialty: 'Medical Care',
    rating: 4.9,
    avatar: '👨‍⚕️',
    isAvailable: true,
  },
  {
    id: '3',
    name: 'Linda Chen',
    specialty: 'Companion Care',
    rating: 4.7,
    avatar: '👩',
    isAvailable: false,
  },
];

export const demoEmergencyContacts: EmergencyContact[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    phone: '(604) 555-0123',
    relationship: 'Daughter',
    isPrimary: true,
  },
  {
    id: '2',
    name: 'Mike Johnson',
    phone: '(604) 555-0124',
    relationship: 'Son',
    isPrimary: false,
  },
  {
    id: '3',
    name: 'Emergency Services',
    phone: '911',
    relationship: 'Emergency',
    isPrimary: false,
  },
];

export const initializeDemoData = (store: any) => {
  // Add demo medications
  demoMedications.forEach(med => store.addMedication(med));
  
  // Add demo appointments
  demoAppointments.forEach(apt => store.addAppointment(apt));
  
  // Add demo health entries
  demoHealthEntries.forEach(entry => store.addHealthEntry(entry));
  
  // Add demo messages
  demoMessages.forEach(msg => store.addMessage(msg));
  
  // Set demo caregivers
  store.setCaregivers(demoCaregivers);
  
  // Add demo emergency contacts
  demoEmergencyContacts.forEach(contact => store.addEmergencyContact(contact));
};
