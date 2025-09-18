import { registerPlugin } from '@capacitor/core';

import type { NfcPlugin, NfcMessage, NfcReadEvent } from './definitions';

const NfcPlug = registerPlugin<NfcPlugin>('Nfc', {
  web: () => import('./web').then((m) => new m.NfcWeb()),
});

export * from './definitions';


export const Nfc: NfcPlugin = {
  readPromise: {
    resolve: () => {},
    reject: () => {}, 
  },
  isReading: false,
  isAvailable: NfcPlug.isAvailable.bind(NfcPlug),

  read: async () => {
    console.log('read');
    return new Promise<NfcReadEvent>((resolve, reject) => {
      Nfc.readPromise = { resolve, reject };
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
  Nfc.readPromise.resolve(data);
});