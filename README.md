# @hereismass/capacitor-nfc

Capacitor plugin to use NFC on web/ios/android

## Install

```bash
npm install @hereismass/capacitor-nfc
npx cap sync
```

## API

<docgen-index>

* [`isAvailable()`](#isavailable)
* [`read()`](#read)
* [`write(...)`](#write)
* [Interfaces](#interfaces)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### isAvailable()

```typescript
isAvailable() => any
```

**Returns:** <code>any</code>

--------------------


### read()

```typescript
read() => any
```

**Returns:** <code>any</code>

--------------------


### write(...)

```typescript
write(message: NfcMessage) => any
```

| Param         | Type                                              |
| ------------- | ------------------------------------------------- |
| **`message`** | <code><a href="#nfcmessage">NfcMessage</a></code> |

**Returns:** <code>any</code>

--------------------


### Interfaces


#### NfcReadEvent

| Prop               | Type                                              |
| ------------------ | ------------------------------------------------- |
| **`serialNumber`** | <code>string</code>                               |
| **`message`**      | <code><a href="#nfcmessage">NfcMessage</a></code> |


#### NfcMessage

| Prop          | Type            |
| ------------- | --------------- |
| **`records`** | <code>{}</code> |


#### NfcRecord

| Prop             | Type                |
| ---------------- | ------------------- |
| **`recordType`** | <code>string</code> |
| **`data`**       | <code>string</code> |

</docgen-api>
