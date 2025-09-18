import { registerPlugin } from '@capacitor/core';

import type { NfcPlugin, NfcPluginInternal, NfcMessage } from './definitions';

const NfcPlug = registerPlugin<NfcPluginInternal>('Nfc', {
  web: () => import('./web').then((m) => new m.NfcWeb()),
});

export * from './definitions';



// let isReading = false;


export const Nfc: NfcPlugin = {
  isAvailable: NfcPlug.isAvailable.bind(NfcPlug),
  /* read: async () => {
   const result = await NfcPlug.read();
   console.log('serialNumber', result.serialNumber);
   console.log('message', result.message);
   return result;
  }, */

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
  // we receive data from the platform
  console.log('onRead', data);
});