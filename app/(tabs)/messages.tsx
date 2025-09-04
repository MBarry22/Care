import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, isToday, isYesterday } from 'date-fns';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useStore, Message } from '@/store/useStore';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const { messages, addMessage, markMessageAsRead, currentUser } = useStore();
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');

  // Mock family members and caregivers for demo
  const contacts = [
    { id: '1', name: 'Sarah Johnson', role: 'Daughter', avatar: '👩' },
    { id: '2', name: 'Dr. Smith', role: 'Primary Care', avatar: '👨‍⚕️' },
    { id: '3', name: 'Maria Garcia', role: 'Caregiver', avatar: '👩‍🦱' },
    { id: '4', name: 'Mike Johnson', role: 'Son', avatar: '👨' },
  ];

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    if (!selectedRecipient) {
      Alert.alert('Select Recipient', 'Please select a recipient first');
      return;
    }

    const contact = contacts.find(c => c.id === selectedRecipient);
    if (!contact) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser?.id || 'current-user',
      senderName: currentUser?.name || 'You',
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    addMessage(message);
    setNewMessage('');
  };

  const handleQuickMessage = (template: string) => {
    setNewMessage(template);
  };

  const quickMessageTemplates = [
    "How are you feeling today?",
    "Don't forget your medication!",
    "I'll be there in 30 minutes",
    "Everything is going well",
    "Call me if you need anything",
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Messages</ThemedText>
        {unreadCount > 0 && (
          <ThemedView style={styles.unreadBadge}>
            <ThemedText style={styles.unreadText}>{unreadCount}</ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      <ScrollView style={styles.content}>
        {/* Quick Message Templates */}
        <ThemedView style={styles.templatesSection}>
          <ThemedText type="subtitle">Quick Messages</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesList}>
            {quickMessageTemplates.map((template, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleQuickMessage(template)}
                style={styles.templateButton}
              >
                <ThemedText style={styles.templateText}>{template}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>

        {/* Recipient Selection */}
        <ThemedView style={styles.recipientSection}>
          <ThemedText type="subtitle">Send To</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactsList}>
            {contacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                onPress={() => setSelectedRecipient(contact.id)}
                style={[
                  styles.contactButton,
                  selectedRecipient === contact.id && styles.contactButtonSelected
                ]}
              >
                <ThemedText style={styles.contactAvatar}>{contact.avatar}</ThemedText>
                <ThemedText style={styles.contactName}>{contact.name}</ThemedText>
                <ThemedText style={styles.contactRole}>{contact.role}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>

        {/* Message Input */}
        <ThemedView style={styles.inputSection}>
          <ThemedView style={styles.messageInputContainer}>
            <TextInput
              style={[styles.messageInput, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Type your message..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              style={[
                styles.sendButton,
                { backgroundColor: Colors[colorScheme ?? 'light'].tint }
              ]}
              disabled={!newMessage.trim() || !selectedRecipient}
            >
              <IconSymbol name="paperplane.fill" size={20} color="#fff" />
            </TouchableOpacity>
          </ThemedView>
          <ThemedText style={styles.characterCount}>
            {newMessage.length}/500
          </ThemedText>
        </ThemedView>

        {/* Message History */}
        <ThemedView style={styles.historySection}>
          <ThemedText type="subtitle">Recent Messages</ThemedText>
          {messages.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <IconSymbol name="message" size={48} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
              <ThemedText style={styles.emptyText}>No messages yet</ThemedText>
              <ThemedText style={styles.emptySubtext}>Start a conversation with your family or caregivers</ThemedText>
            </ThemedView>
          ) : (
            <ScrollView style={styles.messagesList}>
              {messages
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((message) => (
                  <ThemedView key={message.id} style={styles.messageCard}>
                    <ThemedView style={styles.messageHeader}>
                      <ThemedText type="defaultSemiBold" style={styles.senderName}>
                        {message.senderName}
                      </ThemedText>
                      <ThemedView style={styles.messageMeta}>
                        <ThemedText style={styles.messageTime}>
                          {formatMessageTime(message.timestamp)}
                        </ThemedText>
                        {!message.isRead && (
                          <ThemedView style={styles.unreadDot} />
                        )}
                      </ThemedView>
                    </ThemedView>
                    <ThemedText style={styles.messageContent}>
                      {message.content}
                    </ThemedText>
                    {!message.isRead && message.senderId !== currentUser?.id && (
                      <TouchableOpacity
                        onPress={() => markMessageAsRead(message.id)}
                        style={styles.markReadButton}
                      >
                        <ThemedText style={styles.markReadText}>Mark as read</ThemedText>
                      </TouchableOpacity>
                    )}
                  </ThemedView>
                ))}
            </ScrollView>
          )}
        </ThemedView>
      </ScrollView>
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
  unreadBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  templatesSection: {
    marginBottom: 20,
  },
  templatesList: {
    marginTop: 12,
  },
  templateButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  templateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  recipientSection: {
    marginBottom: 20,
  },
  contactsList: {
    marginTop: 12,
  },
  contactButton: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    minWidth: 80,
  },
  contactButtonSelected: {
    backgroundColor: 'rgba(0,122,255,0.1)',
    borderColor: '#007AFF',
  },
  contactAvatar: {
    fontSize: 24,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  contactRole: {
    fontSize: 10,
    opacity: 0.7,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 20,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    padding: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  characterCount: {
    fontSize: 12,
    opacity: 0.5,
    textAlign: 'right',
    marginTop: 4,
  },
  historySection: {
    flex: 1,
  },
  messagesList: {
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
    textAlign: 'center',
  },
  messageCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderName: {
    flex: 1,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  markReadButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
  },
  markReadText: {
    fontSize: 12,
    color: '#007AFF',
  },
});
