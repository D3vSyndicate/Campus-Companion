import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/superbase';

export default function AdminScreen() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');

  const handlePostAnnouncement = async () => {
    if (!title || !message) {
      Alert.alert("Notice", "Please fill in all fields.");
      return;
    }

    const { error } = await supabase.from('Announcement').insert([
      { title, message, priority, date_posted: new Date().toISOString() }
    ]);

    if (error) {
      Alert.alert("Error", "Could not post announcement.");
    } else {
      Alert.alert("Success", "Announcement posted to student app!");
      setTitle('');
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coordinator Content Portal</Text>
      <Text style={styles.sub}>Post updates directly to student home screens.</Text>

      <TextInput
        style={styles.input}
        placeholder="Announcement Title"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Message for students (e.g., Venue change for Lab 1)..."
        value={message}
        onChangeText={setMessage}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handlePostAnnouncement}>
        <Text style={styles.btnText}>Publish Announcement</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FFF' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  sub: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', padding: 12, borderRadius: 8, marginBottom: 12 },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: { backgroundColor: '#16A34A', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '600' },
});