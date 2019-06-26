
var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomMsg = new Schema({
    room_id: {
        type: String
    },
    last_seen: {
        type: Date
    }
})

const UsersSchema = new Schema({
    name: String,
    username: String,
    password: String,
    avatar: String,
    friends: [],
    rooms: [RoomMsg],
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
    },
    updateRoom: async (userId, roomId, last_seen) => {
        let user = await UsersDB.findOne({_id: userId});
        let rooms = user.rooms;
        if (!rooms.length) {
            rooms = [{
                room_id: roomId,
                last_seen: last_seen
            }];
        } else {
            let roomIndex = rooms.findIndex(x=>x.room_id == roomId);
            if (roomIndex > -1) {
                rooms[roomIndex].last_seen = last_seen;
            } else {
                rooms.push({
                    room_id: roomId,
                    last_seen: last_seen
                });
            }
        }

        await UsersDB.updateOne({_id: userId}, { $set: {rooms: rooms}} ).then((r)=>{
            return true;
        },err=>{
            return false;
        });
    }
}
module.exports = {UsersDB, UserRepo};