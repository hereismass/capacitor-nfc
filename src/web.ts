import { WebPlugin } from '@capacitor/core';

import type { NfcMessage, NfcPluginBasic } from './definitions';

declare class NDEFMessage {
  constructor(messageInit: NDEFMessageInit);
  records: readonly NDEFRecord[];
}
declare type NDEFMessageInit = {
  records: NDEFRecordInit[];
};

declare type NDEFRecordDataSource = string | BufferSource | NDEFMessageInit;

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

export class NfcWeb extends WebPlugin implements NfcPluginBasic {
  canUseNFC: boolean = false;
  NFCPermissionStatus: string = 'unknown';
  ndef: NDEFReader | null = null;
  abortController: AbortController | null = null;
  constructor() {
    super();
    if ('NDEFReader' in window) {
      this.canUseNFC = true;
      this.checkPermission();
      this.ndef = new NDEFReader();

      this.abortController = new AbortController();
      this.abortController.signal.onabort = (_e: Event) => {
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

  cancelRead(): Promise<void> {
    console.log('cancelRead web');
    return Promise.resolve();
  }

  cancelWrite(): Promise<void> {
    console.log('cancelWrite web');
    return Promise.resolve();
  }

  startRead(): Promise<void> {
    if (!this.canUseNFC) {
      this.notifyListeners('onRead', { success: false, error: 'NFC is not available' });
      return Promise.resolve();
    }
    if (this.NFCPermissionStatus === 'denied') {
      this.notifyListeners('onRead', { success: false, error: 'NFC Reading permission denied' });
      return Promise.resolve();
    }

    this.ndef!.scan({ signal: this.abortController!.signal });
    this.ndef!.addEventListener(
      'reading',
      (event: Event) => {
        const ndefEvent = event as unknown as NDEFReadingEvent;
        console.log('read event', ndefEvent);
        this.abortController!.abort();
        this.notifyListeners('onRead', {
          success: true,
          serialNumber: ndefEvent.serialNumber,
          message: ndefEvent.message,
        });
      },
      { once: true, signal: this.abortController!.signal } as AddEventListenerOptions,
    );

    this.ndef!.addEventListener(
      'readingerror',
      () => {
        console.log('read error');
        this.abortController!.abort();
        this.notifyListeners('onRead', { success: false, error: 'NFC Reading error' });
      },
      { once: true, signal: this.abortController!.signal } as AddEventListenerOptions,
    );

    return Promise.resolve();
  }

  writeNDEF(_message: NfcMessage): Promise<void> {
    console.log('writeNDEF web');
    return Promise.resolve();
  }
  
}