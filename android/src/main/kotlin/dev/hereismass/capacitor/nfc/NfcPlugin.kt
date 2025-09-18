package dev.hereismass.capacitor.nfc

import android.app.ActivityOptions
import android.app.PendingIntent
import android.content.Intent
import android.content.IntentFilter
import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.nfc.NfcAdapter
import android.nfc.NfcAdapter.ACTION_NDEF_DISCOVERED
import android.nfc.NfcAdapter.ACTION_TAG_DISCOVERED
import android.nfc.NfcAdapter.ACTION_TECH_DISCOVERED
import android.nfc.NfcAdapter.EXTRA_NDEF_MESSAGES
import android.nfc.NfcAdapter.getDefaultAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.nfc.tech.MifareClassic
import android.nfc.tech.MifareUltralight
import android.nfc.tech.Ndef
import android.nfc.tech.NdefFormatable
import android.nfc.tech.NfcA
import android.nfc.tech.NfcB
import android.nfc.tech.NfcBarcode
import android.nfc.tech.NfcF
import android.nfc.tech.NfcV
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.annotation.RequiresApi
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONObject
import java.io.IOException
import java.io.UnsupportedEncodingException
import java.nio.charset.Charset
import java.util.Base64

@CapacitorPlugin(name = "Nfc")
class NfcPlugin : Plugin() {
    private var writeMode = false
    private var recordsBuffer: JSArray? = null

    private val techListsArray = arrayOf(arrayOf<String>(
        IsoDep::class.java.name,
        MifareClassic::class.java.name,
        MifareUltralight::class.java.name,
        Ndef::class.java.name,
        NdefFormatable::class.java.name,
        NfcBarcode::class.java.name,
        NfcA::class.java.name,
        NfcB::class.java.name,
        NfcF::class.java.name,
        NfcV::class.java.name
    ))

    @RequiresApi(Build.VERSION_CODES.TIRAMISU)
    public override fun handleOnNewIntent(intent: Intent?) {
        super.handleOnNewIntent(intent)

        if (intent == null || intent.action.isNullOrBlank()) {
            return
        }       

        if (writeMode) {
            Log.d("Nfc", "WRITE MODE START")
            handleWriteTag(intent)
            writeMode = false
            recordsBuffer = null
        }
    else if (ACTION_NDEF_DISCOVERED == intent.action || ACTION_TAG_DISCOVERED == intent.action || ACTION_TECH_DISCOVERED == intent.action) {
            Log.d("Nfc", "READ MODE START")
            handleReadTag(intent)
        }
    }

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val adapter = NfcAdapter.getDefaultAdapter(this.activity)
        val ret = JSObject()
        ret.put("available", adapter != null)
        call.resolve(ret)
    }

    @PluginMethod
    fun cancelWrite(call: PluginCall) {
        this.writeMode = false
        call.resolve()
    }

    @PluginMethod
    fun cancelRead(call: PluginCall) {
        call.resolve()
    }

    @PluginMethod
    fun writeNDEF(call: PluginCall) {
        print("writeNDEF called")

        writeMode = true
        recordsBuffer = call.getArray("records")

        call.resolve()
    }

    override fun handleOnPause() {
        super.handleOnPause()
        getDefaultAdapter(this.activity)?.disableForegroundDispatch(this.activity)
    }

    override fun handleOnResume() {
        super.handleOnResume()
        if(getDefaultAdapter(this.activity) == null) return;

        val intent = Intent(context, this.activity.javaClass).apply {
            addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }

        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            PendingIntent.FLAG_MUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        var activityOptionsBundle: Bundle? = null

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) { // API 35 (Android 15)
            activityOptionsBundle = ActivityOptions.makeBasic().apply {
                setPendingIntentCreatorBackgroundActivityStartMode(ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED)
            }.toBundle()
        }

        val pendingIntent =
            PendingIntent.getActivity(
                this.activity,
                0,
                intent,
                pendingIntentFlags,
                activityOptionsBundle
            )

        val intentFilter: Array<IntentFilter> =
            arrayOf(
                IntentFilter(ACTION_NDEF_DISCOVERED).apply {
                    try {
                        addDataType("text/plain")
                    } catch (e: IntentFilter.MalformedMimeTypeException) {
                        throw RuntimeException("failed", e)
                    }
                },
                IntentFilter(ACTION_TECH_DISCOVERED),
                IntentFilter(ACTION_TAG_DISCOVERED)
            )

        getDefaultAdapter(this.activity).enableForegroundDispatch(
            this.activity,
            pendingIntent,
            intentFilter,
            techListsArray
        )
    }

    @RequiresApi(Build.VERSION_CODES.TIRAMISU)
    private fun handleWriteTag(intent: Intent) {
        val records = recordsBuffer?.toList<JSONObject>()
        if(records != null) {
            val ndefRecords = mutableListOf<NdefRecord>()

            try {
                for (record in records) {
                    val payload = record.getJSONArray("payload")
                    val type: String? = record.getString("type")

                    if (payload.length() == 0 || type == null) {
                        notifyListeners(
                            "onError",
                            JSObject().put(
                                "error",
                                "Invalid record: payload or type is missing."
                            )
                        )
                        return
                    }

                    val typeBytes = type.toByteArray(Charsets.UTF_8)
                    val payloadBytes = ByteArray(payload.length())
                    for(i in 0 until payload.length()) {
                        payloadBytes[i] = payload.getInt(i).toByte()
                    }

                    ndefRecords.add(
                        NdefRecord(
                            NdefRecord.TNF_WELL_KNOWN,
                            typeBytes,
                            ByteArray(0),
                            payloadBytes
                        )
                    )
                }

                val ndefMessage = NdefMessage(ndefRecords.toTypedArray())
                val tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG, Tag::class.java)
                var ndef = Ndef.get(tag)

                if (ndef == null) {
                    val formatable = NdefFormatable.get(tag)
                    if (formatable != null) {
                        try {
                            formatable.connect()
                            val mimeRecord = NdefRecord.createMime("text/plain", "INIT".toByteArray(
                                Charset.forName("US-ASCII")))
                            val msg = NdefMessage(mimeRecord)
                            formatable.format(msg)
                            // Success!
                            // Emit event to Capacitor plugin for success
                            println("Successfully formatted and wrote NDEF message to tag!")
                        } catch (e: IOException) {
                            // Error connecting or formatting
                            // Emit event to Capacitor plugin for error
                            println("Error formatting or writing to NDEF-formatable tag: ${e.message}")
                        } catch (e: Exception) { // Catch other potential exceptions during format, like TagLostException
                            println("Error during NDEF formatting: ${e.message}")
                        } finally {
                            try {
                                formatable.close()
                            } catch (e: IOException) {
                                println("Error closing NdefFormatable connection: ${e.message}")
                            }
                        }

                        ndef = Ndef.get(formatable.tag)
                    } else {
                        notifyListeners(
                            "onError",
                            JSObject().put(
                                "error",
                                "Tag does not support NDEF writing."
                            )
                        )
                        return
                    }
                }

                ndef.use { // Use block ensures ndef.close() is called
                    ndef.connect()
                    if (!ndef.isWritable) {
                        notifyListeners(
                            "onError",
                            JSObject().put(
                                "error",
                                "NFC tag is not writable"
                            )
                        )
                        return
                    }
                    if (ndef.maxSize < ndefMessage.toByteArray().size) {
                        notifyListeners(
                            "onError",
                            JSObject().put(
                                "error",
                                "Message too large for this NFC Tag (max ${ndef.maxSize} bytes)."
                            )
                        )
                        return
                    }

                    ndef.writeNdefMessage(ndefMessage)
                    Log.d("NFC", "NDEF message successfully written to tag.")
                }

                notifyListeners("onWrite", JSObject().put("success", true))
            }
            catch (e: UnsupportedEncodingException) {
                Log.e("NFC", "Encoding error during NDEF record creation: ${e.message}")
                notifyListeners(
                    "onError",
                    JSObject().put(
                        "error",
                        "Encoding error: ${e.message}"
                    )
                )
            }
            catch (e: IOException) {
                Log.e("Nfc", "I/O error during NFC write: ${e.message}")
                notifyListeners(
                    "onError",
                    JSObject().put(
                        "error",
                        "Nfc I/O error: ${e.message}"
                    )
                )
            }
            catch (e: Exception) {
                Log.e("Nfc", "Error writing NDEF message: ${e.message}", e)
                notifyListeners(
                    "onError",
                    JSObject().put(
                        "error",
                        "Failed to write NDEF message: ${e.message}"
                    )
                )
            }
        }
        else {
            notifyListeners("onError", JSObject().put("error", "Failed to write NFC tag"))
        }
    }

    @RequiresApi(Build.VERSION_CODES.TIRAMISU)
    private fun handleReadTag(intent: Intent) {
        val jsResponse = JSObject()
        val ndefMessages = JSArray()

        // Try to obtain raw NDEF messages first (ACTION_NDEF_DISCOVERED path)
        val receivedMessages = intent.getParcelableArrayExtra(
            EXTRA_NDEF_MESSAGES,
            NdefMessage::class.java
        )

        if (receivedMessages != null && receivedMessages.isNotEmpty()) {
            // Standard NDEF-discovered path
            for (message in receivedMessages) {
                ndefMessages.put(ndefMessageToJS(message))
            }
        } else {
            // For ACTION_TAG_DISCOVERED or ACTION_TECH_DISCOVERED we may still have an NDEF tag.
            val tag: Tag? = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG, Tag::class.java)
            var added = false
            if (tag != null) {
                val ndef = Ndef.get(tag)
                if (ndef != null) {
                    try {
                        ndef.connect()
                        // Prefer cached message to avoid additional IO if available
                        val message: NdefMessage? = ndef.cachedNdefMessage ?: try {
                            ndef.ndefMessage
                        } catch (e: Exception) { null }
                        if (message != null) {
                            ndefMessages.put(ndefMessageToJS(message))
                            added = true
                        }
                    } catch (e: Exception) {
                        Log.w("Nfc", "Failed to read NDEF message from TECH/TAG intent: ${e.message}")
                    } finally {
                        try { ndef.close() } catch (_: Exception) {}
                    }
                }

                // If no NDEF message found, fallback to tag ID (legacy behavior)
                if (!added) {
                    val tagId = intent.getByteArrayExtra(NfcAdapter.EXTRA_ID)
                    val result = if (tagId != null) byteArrayToHexString(tagId) else ""
                    val rec = JSObject()
                    rec.put("type", "ID")
                    rec.put("payload", Base64.getEncoder().encodeToString(result.toByteArray()))
                    val ndefRecords = JSArray().apply { put(rec) }
                    val msg = JSObject().apply { put("records", ndefRecords) }
                    ndefMessages.put(msg)
                }
            }
        }

        jsResponse.put("messages", ndefMessages)
        this.notifyListeners("onRead", jsResponse)
    }

    private fun ndefMessageToJS(message: NdefMessage): JSObject {
        val ndefRecords = JSArray()
        for (record in message.records) {
            val rec = JSObject()
            rec.put("type", String(record.type, Charsets.UTF_8))
            rec.put("payload", Base64.getEncoder().encodeToString(record.payload))
            ndefRecords.put(rec)
        }
        val msg = JSObject()
        msg.put("records", ndefRecords)
        return msg
    }

    private fun byteArrayToHexString(inarray: ByteArray): String {
        val hex = arrayOf("0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F")
        var out = ""

        for (j in inarray.size - 1 downTo 0) {
            val `in` = inarray[j].toInt() and 0xff
            val i1 = (`in` shr 4) and 0x0f
            out += hex[i1]
            val i2 = `in` and 0x0f
            out += hex[i2]
        }
        return out
    }
}