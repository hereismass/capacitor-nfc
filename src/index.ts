import { Capacitor, registerPlugin } from '@capacitor/core';

import type {
  NfcPlugin,
  NfcPluginBasic,
  NfcReadEvent,
  NfcMessage,
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
  isReading: false,
  isAvailable: NfcPlug.isAvailable.bind(NfcPlug),
  cancelRead: NfcPlug.cancelRead.bind(NfcPlug),
  cancelWrite: NfcPlug.cancelWrite.bind(NfcPlug),

  read: async () => {
    console.log('read');
    if (Nfc.isReading === true) {
      throw new Error('Already reading');
    }
    Nfc.isReading = true;
    return new Promise<NfcReadEvent>((resolve, reject) => {
      Nfc.readPromise = { resolve, reject };
    });
  },
  write: async (message: NfcMessage) => {
    console.log('write', message);
    return Promise.resolve();
  },


  /* removeAllListeners: (eventName: 'nfcTag' | 'nfcError') => {
    Nfc.wrapperListeners = [];
    return NfcPlug.removeAllListeners(eventName);
  },
  wrapperListeners: [], */

  /* async writeNDEF<T extends PayloadType = Uint8Array>(options?: NDEFWriteOptions<T>): Promise<void> {
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

    const recordsArray = options?.records ?? [];
    if (recordsArray.length === 0) throw new Error('At least one NDEF record is required');

    const ndefMessage: NDEFWriteOptions<number[]> = {
      records: recordsArray.map((record) => {
        let payload: number[] | null = null;

        if (typeof record.payload === 'string') {
          // Apply spec-compliant formatting only for Well Known Text (T) & URI (U) types.
          if (record.type === 'T') {
            payload = buildTextPayload(record.payload);
          } else if (record.type === 'U') {
            payload = buildUriPayload(record.payload);
          } else {
            // Generic string: raw UTF-8 bytes (no extra framing)
            payload = Array.from(new TextEncoder().encode(record.payload));
          }
        } else if (Array.isArray(record.payload)) {
          // Assume already raw bytes; do NOT modify
          payload = record.payload as number[];
        } else if (record.payload instanceof Uint8Array) {
          payload = Array.from(record.payload);
        }

        if (!payload) throw new Error('Unsupported payload type');

        return { type: record.type, payload };
      }),
    };

    await NfcPlug.writeNDEF(ndefMessage);
  }, */
};


// ----- Payload transformation helpers -----
/* type DecodeSpecifier = 'b64' | 'string' | 'uint8Array' | 'numberArray';
type decodedType<T extends DecodeSpecifier> = NDEFMessages<
  T extends 'b64' ? string : T extends 'string' ? string : T extends 'uint8Array' ? Uint8Array : number[]
>;

*/

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

const toStringPayload = (recordType: string, bytes: Uint8Array): string => {
  // Well Known Text
  if (recordType === 'T') return decodeTextRecord(bytes);
  // Well Known URI
  if (recordType === 'U') return decodeUriRecord(bytes);
  // Default: attempt UTF-8 decode
  try {
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return Array.from(bytes)
      .map((c) => String.fromCharCode(c))
      .join('');
  }
};



const formatType = (type: string): string => {
  switch (type) {
    case 'T': return 'text';
    case 'U': return 'url';
    default: return type;
  }
}

const formatPayload = (data: any): NfcReadEvent => {
  return {
    serialNumber: data.serialNumber,
    message: {
      records: data.message.records.map((record: any) => {
        return {
          recordType: formatType(record.type),
          data: toStringPayload(record.type, decodeBase64ToBytes(record.payload))
        }
      })
    }
  };
};

NfcPlug.addListener('onRead', (data: any): void => {

  if (Nfc.isReading === false) {
    return;
  }
  console.log(Capacitor.getPlatform());
  console.log("onRead", data);
  if (Capacitor.getPlatform() === 'android') {
    console.log("formatPayload for android");
    data = formatPayload(data);
  }

  console.log("onRead after format", data);

  Nfc.readPromise.resolve(data);
});