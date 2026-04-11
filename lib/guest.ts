import AsyncStorage from '@react-native-async-storage/async-storage';

export async function enableGuestMode() {
  await AsyncStorage.setItem('guest_mode', 'true');
}

export async function disableGuestMode() {
  await AsyncStorage.removeItem('guest_mode');
}

export async function isGuestMode(): Promise<boolean> {
  const val = await AsyncStorage.getItem('guest_mode');
  return val === 'true';
}

// Synchronous check for use in render — reads from a cached value
let _guestCache: boolean | null = null;

export async function warmGuestCache() {
  _guestCache = await isGuestMode();
  return _guestCache;
}

export function isGuestModeSync(): boolean {
  return _guestCache === true;
}
