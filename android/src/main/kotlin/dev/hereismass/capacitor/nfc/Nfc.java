package dev.hereismass.capacitor.nfc;

import com.getcapacitor.Logger;

public class Nfc {

    public String echo(String value) {
        Logger.info("Echo", value);
        return value;
    }
}
