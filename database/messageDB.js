
var mongoose = require('mongoose');
const Schema = mongoose.Schema;
const MessagesSchema = new Schema({
    user: Object,
    message: String,
    room_id: String,
    created_at: Date,
    deleted: Boolean
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
    }
}
module.exports = {MessagesDB, MessagesRepo};