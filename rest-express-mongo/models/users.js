const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;
const mySchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
});
mySchema.pre("save", async function (next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

mySchema.statics.login =  async function (username, password) {
    const user = await User.findOne({ username });
    if (user) {
        const valPass = await bcrypt.compare(password, user.password);
        if (valPass) {
            return user;
        }
        throw Error("incorrect password");
    }
    throw Error("user does not exists.");
};

const User = mongoose.model("User", mySchema);
module.exports = User;
