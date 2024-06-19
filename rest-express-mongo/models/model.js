const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mySchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
    },
    username: {
        type: String,
    },
});
const Note = mongoose.model("Note", mySchema);
module.exports = Note;
