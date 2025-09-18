import { WebPlugin } from '@capacitor/core';

import type {  NfcPluginInternal } from './definitions';

declare class NDEFMessage {
  constructor(messageInit: NDEFMessageInit);
  records: readonly NDEFRecord[];
}
declare type NDEFMessageInit = {
  records: NDEFRecordInit[];
};

declare type NDEFRecordDataSource = string | BufferSource | NDEFMessageInit;

/* type Window = {
  NDEFRecord: NDEFRecord;
  NDEFReader: NDEFReader;
  NDEFReadingEvent: NDEFReadingEvent;
}; */
declare class NDEFRecord {
  constructor(recordInit: NDEFRecordInit);
  readonly recordType: string;
  readonly mediaType?: string;
  readonly id?: string;
  readonly data?: DataView;
  readonly encoding?: string;
  readonly lang?: string;
  toRecords?: () => NDEFRecord[];
}
declare type NDEFRecordInit = {
  recordType: string;
  mediaType?: string;
  id?: string;
  encoding?: string;
  lang?: string;
  data?: NDEFRecordDataSource;
};

declare type NDEFMessageSource = string | BufferSource | NDEFMessageInit;

declare class NDEFReader extends EventTarget {
  onreading: (this: this, event: NDEFReadingEvent) => any;
  onreadingerror: (this: this, error: Event) => any;
  scan: (options?: NDEFScanOptions) => Promise<void>;
  write: (
    message: NDEFMessageSource,
    options?: NDEFWriteOptions,
  ) => Promise<void>;
  makeReadOnly: (options?: NDEFMakeReadOnlyOptions) => Promise<void>;
}

declare class NDEFReadingEvent extends Event {
  constructor(type: string, readingEventInitDict: NDEFReadingEventInit);
  serialNumber: string;
  message: NDEFMessage;
}
type NDEFReadingEventInit = {
  serialNumber?: string;
  message: NDEFMessageInit;
} & EventInit;

type NDEFWriteOptions = {
  overwrite?: boolean;
  signal?: AbortSignal;
};
type NDEFMakeReadOnlyOptions = {
  signal?: AbortSignal;
};
type NDEFScanOptions = {
  signal: AbortSignal;
};

export class NfcWeb extends WebPlugin implements NfcPluginInternal {
  canUseNFC: boolean = false;
  NFCPermissionStatus: string = 'unknown';
  ndef: NDEFReader | null = null;
  abortController: AbortController | null = null;
  isReading: boolean = false;

  constructor() {
    super();
    if ('NDEFReader' in window) {
      this.canUseNFC = true;
      this.checkPermission();
      this.ndef = new NDEFReader();

      this.abortController = new AbortController();
      this.abortController.signal.onabort = (_e: Event) => {
        this.isReading = false;
        this.abortController = new AbortController();
      };
    }
  }

  async checkPermission() {
    const permissionName = 'nfc' as PermissionName;
    const permissionStatus = await navigator.permissions.query({
      name: permissionName,
    });
    this.NFCPermissionStatus = permissionStatus.state;

    permissionStatus.onchange = () => {
      this.NFCPermissionStatus = permissionStatus.state;
    };
  }

  isAvailable(): Promise<{ available: boolean }> {
    return Promise.resolve({ available: this.canUseNFC && this.NFCPermissionStatus !== 'denied' });
  }

  /* read(): Promise<NfcReadEvent> {
    if (this.isReading) {
      throw new Error('Already reading');
    }
    if (!this.canUseNFC) {
      throw new Error('NFC is not available');
    }
    if (this.NFCPermissionStatus === 'denied') {
      throw new Error('NFC permission denied');
    }

    let readPromise: {
      resolve: (value: NfcReadEvent) => void;
      reject: (reason?: any) => void;
    } = {
      resolve: () => {},
      reject: () => {},
    };

    this.isReading = true;
    this.ndef!.scan({ signal: this.abortController!.signal });
    this.ndef!.addEventListener(
      'reading',
      (event: Event) => {
        const ndefEvent = event as unknown as NDEFReadingEvent;
        console.log('read event', ndefEvent);
        this.abortController!.abort();
        readPromise.resolve({serialNumber: ndefEvent.serialNumber, message: ndefEvent.message as unknown as NfcMessage});
      },
      { once: true, signal: this.abortController!.signal },
    );

    this.ndef!.addEventListener(
      'readingerror',
      () => {
        console.log('read error');
        this.abortController!.abort();
        readPromise.reject('Reading error');
      },
      { once: true, signal: this.abortController!.signal },
    );

    return new Promise<NfcReadEvent>((resolve, reject) => {
      readPromise = { resolve, reject };
    });
  } */

}
