import React from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSchedule } from '../../../context/ScheduleContext';
import ScheduleForm from '../../../components/ScheduleForm';

export default function EditScheduleItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItem } = useSchedule();
  const existing = getItem(id);

  if (!existing) {
    return <Text style={{ padding: 16 }}>Item not found.</Text>;
  }

  return <ScheduleForm existing={existing} />;
}
