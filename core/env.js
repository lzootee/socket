const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

var Env = {
    readFileEnv: (callback) => {
        fs.readFile('.env', "utf8",function read(err, data) {
            if (err) {
                throw err;
            }
            callback(data);
        });
    },
    convertFileToObject: (contentText) => {
        let arr = contentText.split("\n");
        let obj = {};
        arr.forEach(e => {
            let pos = e.indexOf("=");
            let key = e.substring(0, pos);
            let value = e.substring(pos+1);
            obj[key] = value;
        });
        return obj;
    },
    convertObjectToFile: (obj) => {
        let content = "";
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                content += key+"="+obj[key]+"\n";
            }
        }
        content = content.substring(0, content.length-1);
        return content;
    },
    updateFileEnv: (content, callback) => {
        fs.writeFile('./.env', content, function(err) {
            if(err) {
                return console.log(err);
            }
            callback(true);
        }); 
    },
    get: (key) => {
        return process.env[key];
    }
}

module.exports = Env