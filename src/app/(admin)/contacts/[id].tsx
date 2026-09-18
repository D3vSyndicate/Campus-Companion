import React from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useContacts } from '../../../context/ContactsContext';
import ContactForm from '../../../components/ContactForm';

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItem } = useContacts();
  const existing = getItem(id);

  if (!existing) {
    return <Text style={{ padding: 16 }}>Contact not found.</Text>;
  }

  return <ContactForm existing={existing} />;
}
