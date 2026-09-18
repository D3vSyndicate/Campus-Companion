import { Stack } from 'expo-router';
import React from 'react';
import FaqForm from '../../../components/FaqForm';

export default function NewFaq() {
  return (
    <>
      <Stack.Screen options={{ title: 'Add FAQ' }} />
      <FaqForm />
    </>
  );
}
