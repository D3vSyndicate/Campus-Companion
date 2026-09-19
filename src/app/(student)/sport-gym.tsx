import { useLocalSearchParams } from 'expo-router';
import { SportGym, type SportGymTab } from '../../components/SportGym';

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? '';

export default function SportGymScreen() {
  const params = useLocalSearchParams<{ tab?: string | string[]; focus?: string | string[] }>();
  const initialTab: SportGymTab = first(params.tab) === 'gym' ? 'gym' : 'sport';

  return <SportGym initialTab={initialTab} focusId={first(params.focus)} />;
}
