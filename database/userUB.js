
var mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UsersSchema = new Schema({
    name: String,
    username: String,
    password: String,
    avatar: String,
    friends: [],
    permission: Number,
    created_at: Date
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
    },
    friendCount: async (username) => {
        let user = await UsersDB.findOne({username: username});
        return user.friends.length;
    }
}
module.exports = {UsersDB, UserRepo};