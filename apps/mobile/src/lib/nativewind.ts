import { MapView } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cssInterop } from 'nativewind';

cssInterop(MapView, {
  className: 'style',
});

cssInterop(SafeAreaView, {
  className: 'style',
});
