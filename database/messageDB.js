
var mongoose = require('mongoose');
var { RoomsDB, RoomRepo } = require("./roomDB");

const Schema = mongoose.Schema;

const MessagesSchema = new Schema({
    user: Object,
    message: String,
    room_id: String,
    created_at: Date,
    deleted: {type: Boolean, default: false}
});
var MessagesDB = mongoose.model('messages', MessagesSchema);
var MessagesRepo = {
    getInRoom: async (roomId) => {
        return await MessagesDB.find({deleted: false, room_id: roomId}).sort({created_at: 1});
    },
    insert: async (msg) => {
        let messageObj = {
            user : msg.user,
            message : msg.message,
            room_id : msg.room_id,
            created_at : new Date(),
            deleted : false
        }
        return await MessagesDB.create(messageObj);
    },
    notifyMsg: async (user) => {
        let result = [];

        for (let i = 0; i < user.rooms.length; i++) {
            const e = user.rooms[i];
            let room = await RoomsDB.findOne({ _id: e.room_id});
            let msg = await MessagesDB.countDocuments({ room_id: e.room_id, created_at: { $gte: e.last_seen }});
            result.push({
                room_id: e.room_id,
                name: room.name,
                sum: msg
            });
        }
        return result;
    }
}
module.exports = {MessagesDB, MessagesRepo};