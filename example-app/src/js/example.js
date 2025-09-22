import { Nfc } from '@hereismass/capacitor-nfc';

window.testIsAvailable = () => {
    Nfc.isAvailable().then((result) => {
        document.getElementById("isAvailable").innerHTML = result.available;
    });
}

window.testRead = () => {
    Nfc.read().then((result) => {
        document.getElementById("readResult").innerHTML = JSON.stringify(result, null, 2);
    });
}

window.testWrite = () => {
    const r = Math.random();
    console.log("testWrite", r);
    Nfc.write({
        records: [
            {
                recordType: 'text',
                data: "Hello, NFC! " + r
            },
            {
                recordType: 'url',
                data: "https://app.geartracker.net/i/1234567890"
            }
        ]
    }).then((result) => {
        console.log("testWrite success");
        document.getElementById("writeResult").innerHTML = JSON.stringify(result, null, 2);
    });
}
