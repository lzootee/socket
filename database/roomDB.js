
var mongoose = require('mongoose');
const Schema = mongoose.Schema;
const RoomsSchema = new Schema({
    name: String,
    created_by: String,  // User create
    user_in_room: [],
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
    // update: (room) => {
    //     return aw
    // }
}
module.exports = {RoomsDB, RoomRepo};