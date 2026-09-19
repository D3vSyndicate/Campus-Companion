import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/login" />;
}
// This file is required to make the root route work. It will redirect to the login page.