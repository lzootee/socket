var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var env = require("./env");
const APP_KEY = "APP_KEY";
const APP_IV = "APP_IV";

var Encryption = {
    encrypt: (text) => {
        let key = Buffer.from(env.get(APP_KEY),'hex');
        let iv = Buffer.from(env.get(APP_IV),'hex');
        var cipher = crypto.createCipheriv(algorithm, key, iv);
        var crypted = cipher.update(text, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    },
    decrypt: (text) => {
        let key = Buffer.from(env.get(APP_KEY),'hex');
        let iv = Buffer.from(env.get(APP_IV),'hex');
        var decipher = crypto.createDecipheriv(algorithm, key, iv);
        var dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    }
}

module.exports = Encryption;