const mongoose = require('mongoose')
const validator = require('validator')

const studSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: [true, "Email already exists"],
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error("Invalid email")
            }
        }
    },
    phone: {
        type: Number,
        required: true,
        unique: true,
        minLength:10,
        maxLength:10
    }
})

const Student = mongoose.model('Student', studSchema);

module.exports = Student;