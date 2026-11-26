import * as SecureStore from 'expo-secure-store';

import { deleteToken, readToken, writeToken } from '@/lib/secure-store';
import { writeJson } from '@/lib/storage';

// The Keychain / Keystore, in memory. Unlike the kv-store it is not cleared between tests on
// its own: that is the point — it plays the iOS Keychain that survives an uninstall.
jest.mock('expo-secure-store', () => {
  const values = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => values.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void values.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void values.delete(key)),
    __values: values,
  };
});

const keychain = jest.requireMock<{ __values: Map<string, string> }>('expo-secure-store').__values;

/** Deleting the app: iOS removes its own files (the kv-store), never the Keychain. */
function reinstall() {
  jest.requireMock<{ default: { clear: () => void } }>('expo-sqlite/kv-store').default.clear();
}

beforeEach(() => {
  jest.clearAllMocks();
  keychain.clear();
  reinstall();
});

test('a signed-in launch reads the token back', async () => {
  await writeToken('abc');

  await expect(readToken()).resolves.toBe('abc');
});

test('a fresh install throws away a token the Keychain kept from before', async () => {
  keychain.set('auth.token', 'from-the-previous-install');

  await expect(readToken()).resolves.toBeNull();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth.token');
  expect(keychain.has('auth.token')).toBe(false);
});

test('signed in, app deleted and installed again: signed out', async () => {
  await writeToken('abc');
  await expect(readToken()).resolves.toBe('abc');

  reinstall();

  await expect(readToken()).resolves.toBeNull();
});

test('after the first launch of an install, a later sign-in sticks', async () => {
  await expect(readToken()).resolves.toBeNull();

  await writeToken('abc');

  await expect(readToken()).resolves.toBe('abc');
});

test('a marker that is not exactly true does not count', async () => {
  writeJson('install.marker', 'yes');
  keychain.set('auth.token', 'abc');

  await expect(readToken()).resolves.toBeNull();
});

test('deleteToken removes the token', async () => {
  await writeToken('abc');

  await deleteToken();

  await expect(readToken()).resolves.toBeNull();
});
