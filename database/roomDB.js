
var mongoose = require('mongoose');
var constants = require('../core/constant');
const Schema = mongoose.Schema;
const RoomsSchema = new Schema({
    name: String,
    created_by: String,  // User create
    user_in_room: [String],
    type: Number,
    created_at: Date,
    deleted: Boolean
});
var RoomsDB = mongoose.model('rooms', RoomsSchema);
var RoomRepo = {
    getAll: async () => {
        return await RoomsDB.find({deleted: false});
    },
    create: async (room) => {
        return await RoomsDB.create(room);
    },
    findRoomPersonal: async (a, b, isSecret=false) => {
        if (isSecret) {
            return await RoomsDB.findOne( { user_in_room : { $all : [a, b] }, type : constants.ROOM_TYPE.PERSONAL_CHAT_SECRET } );
        } else {
            return await RoomsDB.findOne( { user_in_room : { $all : [a, b] }, type : constants.ROOM_TYPE.PERSONAL_CHAT } );
        }
    }
    // update: (room) => {
    //     return aw
    // }
}
module.exports = {RoomsDB, RoomRepo};