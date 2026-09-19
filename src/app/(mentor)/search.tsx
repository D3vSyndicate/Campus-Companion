import { useLocalSearchParams } from 'expo-router';
import { SearchScreen } from '../../components/search/SearchScreen';

export default function SearchRoute() {
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  return <SearchScreen area="mentor" initialQuery={q ?? ''} />;
}
