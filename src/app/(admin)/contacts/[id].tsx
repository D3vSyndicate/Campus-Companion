import { useLocalSearchParams } from 'expo-router';
import ContactForm from '../../../components/ContactForm';
import { ScaledText as Text } from '../../../components/ScaledText';
import { useContacts } from '../../../context/ContactsContext';

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItem } = useContacts();
  const existing = getItem(id);

  if (!existing) {
    return <Text style={{ padding: 16 }}>Contact not found.</Text>;
  }

  return <ContactForm existing={existing} />;
}
