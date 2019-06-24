#!/usr/bin/env node
const [,, ...args] = process.argv
var crypto = require("crypto");
var env = require("./core/env");

switch (args[0]) {
    case "key":
        var key = crypto.randomBytes(32).toString('hex');
        let iv = crypto.randomBytes(16).toString('hex');
        let content = "";
        env.readFileEnv((data) => {
            content = data;
            let obj = env.convertFileToObject(content);
            obj["APP_KEY"]=key;
            obj["APP_IV"]=iv;
            content = env.convertObjectToFile(obj);
            env.updateFileEnv(content, (res) => {
                console.log('\x1b[33m%s\x1b[0m', "APP key is " + key);
            });
        });
        break;

    default:
        console.log("\x1b[31m%s\x1b[0m", "Doing nothing!!");
        break;
}