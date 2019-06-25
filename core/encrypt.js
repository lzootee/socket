var crypto = require('crypto');
var Constanst = require("./constant");
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
    },
    hash: (text) => {
        var salt = env.get(APP_KEY);
        const hash = crypto.pbkdf2Sync(text, salt, 1000, 32, 'sha512').toString('hex');
        return [salt, hash].join('$');
    },
    check: (text, hash) => {
        var salt = env.get(APP_KEY);
        const originalHash = hash.split('$')[1];
        const str = crypto.pbkdf2Sync(text, salt, 1000, 32, 'sha512').toString('hex');
        return str === originalHash
    }
}

module.exports = Encryption;