import { Redirect } from 'expo-router';
import { useStore } from '../state/store';

export default function Index() {
  const onboardingDone = useStore((s) => s.onboardingDone);
  return <Redirect href={onboardingDone ? '/(tabs)/home' : '/onboarding/ob01'} />;
}
