import { Nfc } from '@hereismass/capacitor-nfc';

window.testEcho = () => {
    const inputValue = document.getElementById("echoInput").value;
    Nfc.echo({ value: inputValue })
}
