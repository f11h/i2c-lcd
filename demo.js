var tessel = require('tessel');
var LCD = require('./index.js');

//start heartbeat led
tessel.led[2].on();
setInterval(function () {
    tessel.led[2].toggle();
}, 500);

//create display with I²C address 0x27 @ Tessel port B
var lcd = new LCD(tessel.port.B, 0x27);

lcd.init()
    .then(function () {
        return lcd.createChar(0, [
            0x1b, 0x15, 0x0e, 0x1b,
            0x15, 0x1b, 0x15, 0x0e
        ])
    })
    .then(function () {
        return lcd.home();
    })
    .then(function () {
        return lcd.print("Hello Tessel " + String.fromCharCode(0));
    })
    .then(function () {
        console.log("Successfully printed text to display :-)");
    });