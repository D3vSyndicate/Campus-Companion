import { useLocalSearchParams } from 'expo-router';
import { ScaledText as Text } from '../../../components/ScaledText';
import ScheduleForm from '../../../components/ScheduleForm';
import { useSchedule } from '../../../context/ScheduleContext';

export default function EditScheduleItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItem } = useSchedule();
  const existing = getItem(id);

  if (!existing) {
    return <Text style={{ padding: 16 }}>Item not found.</Text>;
  }

  return <ScheduleForm existing={existing} />;
}
