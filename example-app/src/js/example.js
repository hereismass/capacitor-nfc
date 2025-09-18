import { Nfc } from '@hereismass/capacitor-nfc';

window.testIsAvailable = () => {
    Nfc.isAvailable().then((result) => {
        document.getElementById("isAvailable").innerHTML = result.available;
    });
}

window.testRead = () => {
    Nfc.read().then((result) => {
        document.getElementById("readResult").innerHTML = JSON.stringify(result, null, 2);
    }).catch((error) => {
        document.getElementById("readResult").innerHTML = error.message;
    });
}

window.testWrite = () => {
    Nfc.write({
        records: [{
            recordType: "text",
            data: "Hello, World!"
        }]
    }).then(() => {
        document.getElementById("writeResult").innerHTML = "Success";
    });
}


