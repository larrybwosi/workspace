import { SafeAreaView } from 'react-native-safe-area-context';
import { cssInterop, colorScheme, StyleSheet } from 'nativewind';
import { Platform } from 'react-native';

// Defensive flag setting for native
if (typeof (StyleSheet as any).setFlag === 'function') {
  try {
    (StyleSheet as any).setFlag('darkMode', 'class');
  } catch (e) {
    console.warn('NativeWind: Failed to set darkMode flag', e);
  }
}

// On web, we force the darkMode to NOT be media to avoid the crash in colorScheme.set
if (Platform.OS === 'web') {
  if (typeof document !== 'undefined' && document.documentElement) {
    try {
      document.documentElement.style.setProperty('--css-interop-darkMode', 'class');
    } catch (e) {
      console.warn('NativeWind: Failed to set CSS variable', e);
    }
  }

  const originalSet = colorScheme.set;
  if (typeof originalSet === 'function') {
    colorScheme.set = (value: any) => {
      try {
        originalSet(value);
      } catch (e) {
        // If it still fails, just ignore it. We want to avoid the crash during E2E tests.
        console.warn('NativeWind: colorScheme.set failed safely', e);
      }
    };
  }
}

cssInterop(SafeAreaView, {
  className: 'style',
});
