
var mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UsersSchema = new Schema({
    name: String,
    username: String,
    password: String
});
var UsersDB = mongoose.model('users', UsersSchema);
var UserRepo = {
    create: async (user) => {
        return await UsersDB.create(user);
    },
    login: async (username, password) => {
        let user = await UsersDB.findOne({username: username, password: password});
        if (user) {
            return user;
        }
        return false;
    }
}
module.exports = {UsersDB, UserRepo};