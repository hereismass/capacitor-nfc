import { registerPlugin } from '@capacitor/core';

import type { NfcPlugin, NfcPluginInternal, NfcMessage } from './definitions';

const NfcPlug = registerPlugin<NfcPluginInternal>('Nfc', {
  web: () => import('./web').then((m) => new m.NfcWeb()),
});

export * from './definitions';
export const Nfc: NfcPlugin = {
  isAvailable: NfcPlug.isAvailable.bind(NfcPlug),
  read: async () => {
    console.log('read');
    return Promise.resolve({
      serialNumber: '123',
      message: {
        records: [],
      },
    });
  },
  write: async (message: NfcMessage) => {
    console.log('write', message);
    return Promise.resolve();
  },
};

NfcPlug.addListener('onRead', (data) => {
  console.log('onRead', data);
});