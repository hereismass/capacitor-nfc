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
export interface NfcPlugin {
  readPromise: {
    resolve: (value: NfcReadEvent) => void;
    reject: (reason?: any) => void;
  };
  isReading: boolean;
  /**
   * Check if NFC is supported
   */
  isAvailable(): Promise<{ available: boolean }>;

  /**
   * 
   * write a message to the NFC tag
   */
  write(message: NfcMessage): Promise<void>;

  /**
   * read a message from the NFC tag
   */
  read(): Promise<NfcReadEvent>;



  addListener(eventName: 'onRead', listener: (data: any) => void): void;
  addListener(eventName: 'onWrite', listener: () => void): void;
  addListener(eventName: 'onError', listener: () => void): void;
 }