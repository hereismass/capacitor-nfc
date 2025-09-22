import { WebPlugin } from '@capacitor/core';

import type { NfcNativeMessage, NfcPluginBasic } from './definitions';

export class NfcWeb extends WebPlugin implements NfcPluginBasic {
  isAvailable(): Promise<{ available: boolean }> {
    return Promise.resolve({ available: false });
  }

  cancelRead(): Promise<void> {
    return Promise.reject('Web is not supported');
  }

  cancelWrite(): Promise<void> {
    return Promise.reject('Web is not supported');
  }

  startRead(): Promise<void> {
    return Promise.reject('Web is not supported');
  }

  async writeNDEF(_message: NfcNativeMessage): Promise<void> {
    return Promise.reject('Web is not supported');
  }
  
}