// import type { PluginListenerHandle } from '@capacitor/core';

// Payload from a new NFC scan is a base64 encoded string
export type PayloadType = string | number[] | Uint8Array;

export interface NfcPluginBasic {
  /**
   * Checks if NFC is available on the device. Returns true on all iOS devices, and checks for support on Android and Web
   */
  isAvailable(): Promise<{ available: boolean }>;


  /**
   * Cancels an ongoing scan session.
   */
  cancelRead(): Promise<void>;

  /**
   * Cancels ongoing write session.
   */
  cancelWrite(): Promise<void>;


  writeNDEF(options: any): Promise<void>;

  

  /**
   * Adds a listener for NFC tag detection events.
   * @param eventName The name of the event ('nfcTag').
   * @param listenerFunc The function to call when an NFC tag is detected.
   */
  addListener(
    eventName: 'onRead',
    listenerFunc: (data: any) => void,
  ): void;

  addListener(
    eventName: 'onWrite',
    listenerFunc: () => void,
  ): void;

  addListener(
    eventName: 'onError',
    listenerFunc: (error: any) => void,
  ): void;

  removeAllListeners(eventName: 'onRead' | 'onWrite' | 'onError'): void;
}

export interface NfcRecord {
  recordType: 'empty' | 'text' | 'url' | 'smart-poster' | 'mime' | 'unknown' | string;
  data: string;
}

export interface NfcMessage {
  records: NfcRecord[];
}

export interface NfcReadEvent {
  serialNumber: string;
  message: NfcMessage;
}

export interface NfcPlugin extends Pick<NfcPluginBasic, 'isAvailable' | 'cancelRead' | 'cancelWrite'> {
  readPromise: {
    resolve: (value: NfcReadEvent) => void;
    reject: (reason?: any) => void;
  };
  isReading: boolean;
  read: () => Promise<NfcReadEvent>;
  write: (message: NfcMessage) => Promise<void>;
}