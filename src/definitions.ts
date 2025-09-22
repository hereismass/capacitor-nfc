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


  startRead(): Promise<void>;


  writeNDEF(message: NfcNativeMessage | NfcMessage): Promise<void>;

  

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
    listenerFunc: (data: NfcWriteEvent & { success: boolean, error?: string }) => void,
  ): void;


  removeAllListeners(eventName: 'onRead' | 'onWrite'): void;
}

export interface NfcRecord {
  recordType: 'text' | 'url';
  data: string;
}

export interface NfcNativeRecord {
  type: 'T' | 'U';
  payload: number[];
}

export interface NfcNativeMessage {
  records: NfcNativeRecord[];
}

export interface NfcMessage {
  records: NfcRecord[];
}

export interface NfcReadEvent {
  serialNumber: string;
  message: NfcMessage;
}

export interface NfcWriteEvent {
  serialNumber: string;
}

export interface NfcPlugin extends Pick<NfcPluginBasic, 'isAvailable' | 'cancelRead' | 'cancelWrite'> {
  readPromise: {
    resolve: (value: NfcReadEvent) => void;
    reject: (reason?: any) => void;
  };
  writePromise: {
    resolve: (value: NfcWriteEvent) => void;
    reject: (value: NfcWriteEvent & { error: string }) => void;
  };
  isBusy: boolean;
  read: () => Promise<NfcReadEvent>;
  write: (message: NfcMessage) => Promise<NfcWriteEvent>;
}