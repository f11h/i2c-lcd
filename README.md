Tessel I²C LCD
=======

I²C LCD module using PCF8574P for Tessel

Install
-------

```
npm install tessel-i2c-lcd
```

Hardware
--------

Tested with: 
* 1602 LCD Display Module HD44780 (16x2)

Usage Example
------------

```javascript
var tessel = require('tessel');
var LCD = require('tessel-i2c-lcd');

var lcd = new LCD(tessel.port.B, 0x27);

lcd.init()
    .then(function () {
        return lcd.home();
    })
    .then(function () {
        return lcd.print("Hello World");
    });
```

This allows you to drive a 1602 LCD module using I²C on your Tessel

Based on: https://github.com/sweetpi/i2c-lcd/
