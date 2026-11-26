import * as SecureStore from 'expo-secure-store';

import { readJson, writeJson } from '@/lib/storage';

/**
 * Persistent storage for the bearer token — the Keychain on iOS, the Keystore-backed
 * EncryptedSharedPreferences on Android. Nothing else is persisted: the user lives in memory.
 */

const TOKEN_KEY = 'auth.token';

/**
 * The iOS Keychain outlives the app: delete it, install it again, and the old token is still
 * there — the next person to install the app on that phone would walk into the previous
 * account. So the token only counts once this marker exists. It lives in `lib/storage` (the
 * app's own sqlite file), which iOS deletes with the app, so a missing marker means a fresh
 * install and whatever the Keychain kept is thrown away. Android deletes the token on uninstall
 * by itself; the check costs it nothing.
 */
const INSTALL_MARKER_KEY = 'install.marker';

export async function readToken(): Promise<string | null> {
  if (readJson(INSTALL_MARKER_KEY) !== true) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    writeJson(INSTALL_MARKER_KEY, true);
    return null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function writeToken(token: string): Promise<void> {
  writeJson(INSTALL_MARKER_KEY, true);
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function deleteToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}
