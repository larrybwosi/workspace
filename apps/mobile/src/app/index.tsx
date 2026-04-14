import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: Restore redirect to /(tabs)/feed after verification
  return <Redirect href="/rider-profile" />;
}
