import { registerPlugin } from '@capacitor/core';

import type {
  NfcPlugin,
  NfcPluginBasic,
  NfcReadEvent,
  NfcMessage,
  NfcNativeMessage,
  NfcWriteEvent,
} from './definitions';

const NfcPlug = registerPlugin<NfcPluginBasic>('Nfc', {
  web: () => import('./web').then((m) => new m.NfcWeb()),
});
export * from './definitions';
export const Nfc: NfcPlugin = {
  readPromise: {
    resolve: () => {},
    reject: () => {},
  },
  writePromise: {
    resolve: () => {},
    reject: () => {},
  },
  isBusy: false,
  isAvailable: NfcPlug.isAvailable.bind(NfcPlug),
  cancelRead: NfcPlug.cancelRead.bind(NfcPlug),
  cancelWrite: NfcPlug.cancelWrite.bind(NfcPlug),
  read: async () => {
    if (Nfc.isBusy === true) {
      throw new Error('An action is already in progress');
    }
    Nfc.isBusy = true;
    return new Promise<NfcReadEvent>((resolve, reject) => {
      Nfc.readPromise = { resolve, reject };
    });
  },
  write: async (message: NfcMessage) => {
    if (Nfc.isBusy === true) {
      throw new Error('An action is already in progress');
    }
    Nfc.isBusy = true;
    if (message.records.length === 0) {
      throw new Error('At least one NDEF record is required');
    }

    let messageToWrite = formatWrittenPayload(message);

    await NfcPlug.writeNDEF(messageToWrite);

    return new Promise<NfcWriteEvent>((resolve, reject) => {
      Nfc.writePromise = { resolve, reject };
    });
  },
};


// Helper encoders for well-known record types (only applied to string payloads)
const buildTextPayload = (text: string, lang = 'en'): number[] => {
  const langBytes = Array.from(new TextEncoder().encode(lang));
  const textBytes = Array.from(new TextEncoder().encode(text));
  const status = langBytes.length & 0x3f; // UTF-8 encoding, language length (<= 63)
  return [status, ...langBytes, ...textBytes];
};
const buildUriPayload = (uri: string, prefixCode = 0x00): number[] => {
  const uriBytes = Array.from(new TextEncoder().encode(uri));
  return [prefixCode, ...uriBytes];
};

// Decode a base64 string into a Uint8Array (browser-safe). Existing code used atob already.
const decodeBase64ToBytes = (base64Payload: string): Uint8Array => {
  const bin = atob(base64Payload);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

// Parse NFC Forum "Text" (Well Known 'T') records according to spec.
const decodeTextRecord = (bytes: Uint8Array): string => {
  if (bytes.length === 0) return '';
  const status = bytes[0];
  const isUTF16 = (status & 0x80) !== 0; // Bit 7 indicates encoding
  const langLength = status & 0x3f; // Bits 0-5 language code length
  if (1 + langLength > bytes.length) return ''; // Corrupt
  const textBytes = bytes.slice(1 + langLength);
  try {
    const decoder = new TextDecoder(isUTF16 ? 'utf-16' : 'utf-8');
    return decoder.decode(textBytes);
  } catch {
    // Fallback: naive ASCII
    return Array.from(textBytes)
      .map((b) => String.fromCharCode(b))
      .join('');
  }
};

// Basic URI prefix table for Well Known 'U' records (optional convenience)
const URI_PREFIX: string[] = [
  '',
  'http://www.',
  'https://www.',
  'http://',
  'https://',
  'tel:',
  'mailto:',
  'ftp://anonymous:anonymous@',
  'ftp://ftp.',
  'ftps://',
  'sftp://',
  'smb://',
  'nfs://',
  'ftp://',
  'dav://',
  'news:',
  'telnet://',
  'imap:',
  'rtsp://',
  'urn:',
  'pop:',
  'sip:',
  'sips:',
  'tftp:',
  'btspp://',
  'btl2cap://',
  'btgoep://',
  'tcpobex://',
  'irdaobex://',
  'file://',
  'urn:epc:id:',
  'urn:epc:tag:',
  'urn:epc:pat:',
  'urn:epc:raw:',
  'urn:epc:',
  'urn:nfc:',
];

const decodeUriRecord = (bytes: Uint8Array): string => {
  if (bytes.length === 0) return '';
  const prefixIndex = bytes[0];
  const prefix = URI_PREFIX[prefixIndex] || '';
  const remainder = bytes.slice(1);
  try {
    return prefix + new TextDecoder('utf-8').decode(remainder);
  } catch {
    return (
      prefix +
      Array.from(remainder)
        .map((b) => String.fromCharCode(b))
        .join('')
    );
  }
};

const toStringPayload = (recordType: 'text' | 'url', bytes: Uint8Array): string => {
  // Well Known Text
  if (recordType === 'text') return decodeTextRecord(bytes);
  // Well Known URI
  if (recordType === 'url') return decodeUriRecord(bytes);
  // Default: attempt UTF-8 decode
  try {
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return Array.from(bytes)
      .map((c) => String.fromCharCode(c))
      .join('');
  }
};

const formatReadType = (type: 'T' | 'U'): 'text' | 'url' => {
  switch (type) {
    case 'T': return 'text';
    case 'U': return 'url';
    default: return type;
  }
}

const formatWriteType = (type: 'text' | 'url'): 'T' | 'U' => {
  switch (type) {
    case 'text': return 'T';
    case 'url': return 'U';
    default: return type;
  }
}

const formatMobileReceivedPayload = (data: { serialNumber: string, message: {records: any[]} }): NfcReadEvent => {

  return {
    serialNumber: data.serialNumber,
    message: {
      records: data.message?.records?.map((record: any) => {
        return {
          recordType: formatReadType(record.type),
          data: toStringPayload(formatReadType(record.type), decodeBase64ToBytes(record.payload))
        }
      }) || []
    }
  };
};

const formatWrittenPayload = (message: NfcMessage): NfcNativeMessage => {
  return {
    records: message.records.map((record) => {

      let payload: number[] | null = null;
      const type = formatWriteType(record.recordType);
      if (typeof record.data === 'string') {
        // Apply spec-compliant formatting only for Well Known Text (T) & URI (U) types.
        if (type === 'T') {
          payload = buildTextPayload(record.data);
        } else if (type === 'U') {
          payload = buildUriPayload(record.data);
        } else {
          // Generic string: raw UTF-8 bytes (no extra framing)
          payload = Array.from(new TextEncoder().encode(record.data));
        }
      } else if (Array.isArray(record.data)) {
        // Assume already raw bytes; do NOT modify
        payload = record.data as number[];
      } else if (record.data as any instanceof Uint8Array) {
        payload = Array.from(record.data);
      }

      if (!payload) {
        throw new Error('Unsupported payload type');
      }
      
      return {
        type,
        payload
      }
    })
  };
}


NfcPlug.addListener('onRead', (data: any): void => {
  if (Nfc.isBusy === false) {
    return;
  }
  Nfc.isBusy = false;
  if (data.success === false) {
    Nfc.readPromise.reject(data.error);
    return;
  }

  data = formatMobileReceivedPayload(data);
  
  Nfc.readPromise.resolve(data);
});

NfcPlug.addListener('onWrite', (data: NfcWriteEvent & { success: boolean, error?: string }) => {
  if (Nfc.isBusy === false) {
    return;
  }
  Nfc.isBusy = false;
  if (data.success) {
    Nfc.writePromise.resolve({ serialNumber: data.serialNumber });
  } else {
    Nfc.writePromise.reject({ serialNumber: data.serialNumber, error: data.error! });
  }

});