import { Nfc } from '@hereismass/capacitor-nfc';

window.testIsAvailable = () => {
    Nfc.isAvailable().then((result) => {
        document.getElementById("isAvailable").innerHTML = result.available;
    });
}

window.testRead = () => {
    Nfc.read().then((result) => {
        console.log("testRead", result);
        document.getElementById("readResult").innerHTML = JSON.stringify(result, null, 2);
    });
}

window.testWrite = () => {
    console.log("testWrite");
}


