import { WebPlugin } from '@capacitor/core';

import type {  NfcPluginInternal } from './definitions';

export class NfcWeb extends WebPlugin implements NfcPluginInternal {
  isAvailable(): Promise<{ available: boolean }> {
    return Promise.resolve({ available: true });
  }
}
