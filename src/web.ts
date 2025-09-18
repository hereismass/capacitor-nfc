import { WebPlugin } from '@capacitor/core';

import type { NfcPluginBasic } from './definitions';

export class NfcWeb extends WebPlugin implements NfcPluginBasic {
  isAvailable(): Promise<{ available: boolean }> {
    console.log('isAvailable web');
    return Promise.resolve({ available: false });
  }

  startRead(): Promise<void> {
    console.log('startRead web');
    return Promise.resolve();
  }
  cancelRead(): Promise<void> {
    console.log('cancelRead web');
    return Promise.resolve();
  }

  cancelWrite(): Promise<void> {
    console.log('cancelWrite web');
    return Promise.resolve();
  }

  writeNDEF(): Promise<void> {
    console.log('writeNDEF web');
    return Promise.resolve();
  }
  
}