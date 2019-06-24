var mongoose = require('mongoose');
const URL_DATABASE = dbConnectString();

let options = {useNewUrlParser: true};

var MongoDB = {
    connectDB: async () => {
        mongoose.Promise = global.Promise;
        console.log("url mongo:",URL_DATABASE);
        return await mongoose.connect(URL_DATABASE, options);
    }
}

function dbConnectString () {
    const APP_HOST = 'localhost';
    const APP_DB = 'chat';
    const DB_USER = "";
    const DB_PASS = "";

    if (DB_USER) {
        return `mongodb://${DB_USER}:${DB_PASS}@${APP_HOST}/${APP_DB}`;
    } else {
        return `mongodb://${APP_HOST}/${APP_DB}`;
    }
}

module.exports = MongoDB;
