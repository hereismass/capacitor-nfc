# @hereismass/capacitor-nfc

Capacitor plugin to use NFC on web/ios/android

## Install

```bash
npm install @hereismass/capacitor-nfc
npx cap sync
```

## API

<docgen-index>

* [Interfaces](#interfaces)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

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
