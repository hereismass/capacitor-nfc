export interface NfcMessage {
  records: NfcRecord[];
}

export interface NfcRecord {
  recordType: 'empty' | 'text' | 'url' | 'smart-poster' | 'mime' | 'unknown' | string;
  data: string;
}

export interface NfcReadEvent {
  serialNumber: string;
  message: NfcMessage;
}
export interface NfcPluginInternal {
  /**
   * Check if NFC is supported
   */
  isAvailable(): Promise<{ available: boolean }>;
  // read(): Promise<NfcReadEvent>;

  addListener(eventName: 'onRead', listener: (data: any) => void): void;
  addListener(eventName: 'onWrite', listener: () => void): void;
  addListener(eventName: 'onError', listener: () => void): void;
}

export interface NfcPlugin {
  isAvailable(): Promise<{ available: boolean }>;

  read(): Promise<NfcReadEvent>;

  write(message: NfcMessage): Promise<void>;
}