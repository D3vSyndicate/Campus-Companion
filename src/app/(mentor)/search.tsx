import { useLocalSearchParams } from 'expo-router';
import { SearchScreen } from '../../components/search/SearchScreen';
import { parseScope } from '../../lib/searchScopes';

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default function SearchRoute() {
  const params = useLocalSearchParams<{ q?: string | string[]; scope?: string | string[] }>();
  // /search searches the whole app. /search?scope=schedule searches only that screen's content.
  return <SearchScreen area="mentor" initialQuery={first(params.q) ?? ''} scope={parseScope(first(params.scope))} />;
}
