var Promise = require('bluebird');

var assert = function(val) {
    if (!val) {
        throw "Type Error";
    }
};

var LCD = (function () {
    var i2c;

    function LCD(port, address) {
        i2c = new port.I2C(address);
    }

    LCD.prototype.sendAsync = function (buffer) {
        return new Promise(function (resolve, reject) {
            i2c.send(buffer, function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            })
        })
    };

    LCD.prototype.write4 = function (x, c) {
        var _this = this;
        var a = x & 0xf0; //Use upper 4 bit nibble

        return Promise.resolve()
            .then(function () {
                return _this.sendAsync(new Buffer([a | displayPorts.backlight | c]))
            })
            .delay(1)
            .then(function () {
                return _this.sendAsync(new Buffer([a | displayPorts.E | displayPorts.backlight | c]))
            })
            .delay(1)
            .then(function () {
                return _this.sendAsync(new Buffer([a | displayPorts.backlight | c]))
            })
            .delay(1);
    };

    LCD.prototype.write = function (x, c) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
                return _this.write4(x, c)
            })
            .then(function () {
                return _this.write4(x << 4, c)
            })
    };

    LCD.prototype.init = function () {
        var _this = this;
        return Promise.resolve()
            .then(function () {
                return _this.write4(0x30, displayPorts.CMD);
            })
            .then(function () {
                return _this.write4(0x30, displayPorts.CMD);
            })
            .then(function () {
                return _this.write4(0x30, displayPorts.CMD);
            })
            .then(function () {
                return _this.write4(LCD.FUNCTIONSET | LCD._4BITMODE | LCD._2LINE | LCD._5x10DOTS, displayPorts.CMD);
            })
            .then(function () {
                return _this.write(LCD.DISPLAYCONTROL | LCD.DISPLAYON, displayPorts.CMD);
            })
            .then(function () {
                return _this.write(LCD.ENTRYMODESET | LCD.ENTRYLEFT, displayPorts.CMD);
            })
            .then(function () {
                return _this.write(LCD.CLEARDISPLAY, displayPorts.CMD);
            })
            .delay(200);
    };


    LCD.prototype.clear = function () {
        return this.write(LCD.CLEARDISPLAY, displayPorts.CMD);
    };

    LCD.prototype.print = function (str) {
        var _this = this;
        var charCodes = [];

        assert(typeof str === "string");

        for (var i = 0; i < str.length; i++) {
            charCodes.push(str[i].charCodeAt(0));
        }

        return Promise.each(charCodes, function (charCode) {
            return _this.write(charCode, displayPorts.CHR);
        });
    };
    /**
     flashing block for the current cursor
     */

    LCD.prototype.cursorFull = function () {
        return this.write(LCD.DISPLAYCONTROL | LCD.DISPLAYON | LCD.CURSORON | LCD.BLINKON, displayPorts.CMD);
    };


    /**
     small line under the current cursor
     */

    LCD.prototype.cursorUnder = function () {
        return this.write(LCD.DISPLAYCONTROL | LCD.DISPLAYON | LCD.CURSORON | LCD.BLINKOFF, displayPorts.CMD);
    };


    /**
     set cursor pos, top left = 0,0
     */

    LCD.prototype.setCursor = function (x, y) {
        var l;
        assert(typeof x === "number");
        assert(typeof y === "number");
        assert((0 <= y && y <= 3));
        l = [0x00, 0x40, 0x14, 0x54];
        return this.write(LCD.SETDDRAMADDR | (l[y] + x), displayPorts.CMD);
    };


    /**
     set cursor to 0,0
     */

    LCD.prototype.home = function () {
        return this.setCursor(0, 0);
    };


    /**
     Turn underline cursor off
     */

    LCD.prototype.blink_off = function () {
        return this.write(LCD.DISPLAYCONTROL | LCD.DISPLAYON | LCD.CURSOROFF | LCD.BLINKOFF, displayPorts.CMD);
    };


    /**
     Turn underline cursor on
     */

    LCD.prototype.blink_on = function () {
        return this.write(LCD.DISPLAYCONTROL | LCD.DISPLAYON | LCD.CURSORON | LCD.BLINKOFF, displayPorts.CMD);
    };


    /**
     Turn block cursor off
     */

    LCD.prototype.cursor_off = function () {
        return this.write(LCD.DISPLAYCONTROL | LCD.DISPLAYON | LCD.CURSOROFF | LCD.BLINKON, displayPorts.CMD);
    };


    /**
     Turn block cursor on
     */

    LCD.prototype.cursor_on = function () {
        return this.write(LCD.DISPLAYCONTROL | LCD.DISPLAYON | LCD.CURSORON | LCD.BLINKON, displayPorts.CMD);
    };


    /**
     setBacklight
     */

    LCD.prototype.setBacklight = function (val) {
        displayPorts.backlight = (val ? 0x08 : 0x00);
        return this.write(LCD.DISPLAYCONTROL, displayPorts.CMD);
    };


    /**
     setContrast stub
     */

    LCD.prototype.setContrast = function (val) {
        return this.write(LCD.DISPLAYCONTROL, displayPorts.CMD);
    };


    /**
     Turn display off
     */

    LCD.prototype.off = function () {
        displayPorts.backlight = 0x00;
        return this.write(LCD.DISPLAYCONTROL | LCD.DISPLAYOFF, displayPorts.CMD);
    };


    /**
     Turn display on
     */

    LCD.prototype.on = function () {
        displayPorts.backlight = 0x08;
        return this.write(LCD.DISPLAYCONTROL | LCD.DISPLAYON, displayPorts.CMD);
    };


    /**
     set special character 0..7, data is an array(8) of bytes, and then return to home addr
     */

    LCD.prototype.createChar = function (ch, data) {
        assert(Array.isArray(data));
        assert(data.length === 8);
        return this.write(LCD.SETCGRAMADDR | ((ch & 7) << 3), displayPorts.CMD).then((function (_this) {
            return function () {
                return Promise.each(data, function (d) {
                    return _this.write(d, displayPorts.CHR);
                });
            };
        })(this)).then((function (_this) {
            return function () {
                return _this.write(LCD.SETDDRAMADDR, displayPorts.CMD);
            };
        })(this));
    };

    return LCD;

})();

LCD.CLEARDISPLAY = 0x01;
LCD.RETURNHOME = 0x02;
LCD.ENTRYMODESET = 0x04;
LCD.DISPLAYCONTROL = 0x08;
LCD.CURSORSHIFT = 0x10;
LCD.FUNCTIONSET = 0x20;
LCD.SETCGRAMADDR = 0x40;
LCD.SETDDRAMADDR = 0x80;
LCD.ENTRYRIGHT = 0x00;
LCD.ENTRYLEFT = 0x02;
LCD.ENTRYSHIFTINCREMENT = 0x01;
LCD.ENTRYSHIFTDECREMENT = 0x00;
LCD.DISPLAYON = 0x04;
LCD.DISPLAYOFF = 0x00;
LCD.CURSORON = 0x02;
LCD.CURSOROFF = 0x00;
LCD.BLINKON = 0x01;
LCD.BLINKOFF = 0x00;
LCD.DISPLAYMOVE = 0x08;
LCD.CURSORMOVE = 0x00;
LCD.MOVERIGHT = 0x04;
LCD.MOVELEFT = 0x00;
LCD._8BITMODE = 0x10;
LCD._4BITMODE = 0x00;
LCD._2LINE = 0x08;
LCD._1LINE = 0x00;
LCD._5x10DOTS = 0x04;
LCD._5x8DOTS = 0x00;

var displayPorts = {
    RS: 0x01,
    E: 0x04,
    D4: 0x10,
    D5: 0x20,
    D6: 0x40,
    D7: 0x80,
    CHR: 1,
    CMD: 0,
    backlight: 0x08,
    RW: 0x20
};

module.exports = LCD;
