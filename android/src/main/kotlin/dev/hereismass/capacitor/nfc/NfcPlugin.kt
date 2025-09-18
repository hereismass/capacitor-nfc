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
            Log.d("NFC", "WRITE MODE START")
            handleWriteTag(intent)
            writeMode = false
            recordsBuffer = null
        }
    else if (ACTION_NDEF_DISCOVERED == intent.action || ACTION_TAG_DISCOVERED == intent.action || ACTION_TECH_DISCOVERED == intent.action) {
            Log.d("NFC", "READ MODE START")
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


    override fun handleOnPause() {
        super.handleOnPause()
        getDefaultAdapter(this.activity)?.disableForegroundDispatch(this.activity)
    }


    @RequiresApi(Build.VERSION_CODES.TIRAMISU)
    private fun handleWriteTag(intent: Intent) {
        Log.d("NFC", "Handle write tag")
    }

    @RequiresApi(Build.VERSION_CODES.TIRAMISU)
    private fun handleReadTag(intent: Intent) {
        Log.d("NFC", "Handle read tag")
    }
}
