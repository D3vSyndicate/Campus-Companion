import { useLocalSearchParams } from 'expo-router';
import { GameHost } from '../../components/arcade/GameHost';

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? '';

export default function ArcadeGameScreen() {
  const params = useLocalSearchParams<{ game?: string | string[] }>();

  return <GameHost gameId={first(params.game)} />;
}
