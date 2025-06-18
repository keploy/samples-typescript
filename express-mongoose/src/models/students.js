const mongoose = require('mongoose');
const validator = require('validator');

const studSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error("Invalid email");
            }
        }
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if(value.length !== 10 || !/^\d+$/.test(value)) {
                throw new Error("Phone number must be exactly 10 digits");
            }
        }
    }
});

const Student = mongoose.model('Student', studSchema);

module.exports = Student;