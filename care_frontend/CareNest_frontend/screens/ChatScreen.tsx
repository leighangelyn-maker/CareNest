import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, FlatList, KeyboardAvoidingView, Platform
} from 'react-native';

type Message = {
  id: string;
  text: string;
  sender: 'client' | 'agency';
  time: string;
};

export default function ChatScreen({ navigation, route }: any) {
  const { agencyName, service } = route.params;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! Welcome to ${agencyName}. How can we help you with ${service} service today?`,
      sender: 'agency',
      time: '12:00',
    },
  ]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const getTime = () => {
    const now = new Date();
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'client',
      time: getTime(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const replies = [
        `Thank you for reaching out! We offer ${service} services.`,
        'Please tell us your location and preferred schedule.',
        'We will get back to you with pricing shortly.',
        'Our workers are experienced and verified. You are in good hands!',
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      const agencyMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: reply,
        sender: 'agency',
        time: getTime(),
      };
      setMessages(prev => [...prev, agencyMsg]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{agencyName}</Text>
          <Text style={styles.headerStatus}>🟢 Online</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.sender === 'client' ? styles.clientBubble : styles.agencyBubble
          ]}>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.messageTime}>{item.time}</Text>
          </View>
        )}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#0A1F44' },
  header:        { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#1C2E4A', gap: 16 },
  backText:      { color: '#00BCD4', fontSize: 16 },
  headerInfo:    { flex: 1 },
  headerName:    { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  headerStatus:  { color: '#4CAF50', fontSize: 12 },
  messagesList:  { padding: 16, paddingBottom: 8 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 12, marginBottom: 8 },
  clientBubble:  { backgroundColor: '#00BCD4', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  agencyBubble:  { backgroundColor: '#1C2E4A', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  messageText:   { color: '#fff', fontSize: 15 },
  messageTime:   { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
  inputRow:      { flexDirection: 'row', padding: 12, backgroundColor: '#1C2E4A', alignItems: 'flex-end', gap: 8 },
  input:         { flex: 1, backgroundColor: '#0A1F44', color: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn:       { backgroundColor: '#00BCD4', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendText:      { color: '#fff', fontSize: 18 },
});