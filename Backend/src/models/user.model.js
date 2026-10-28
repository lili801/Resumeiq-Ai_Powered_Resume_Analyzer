const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [ true, "username already taken" ],
        required: true,
    },

    email: {
        type: String,
        unique: [ true, "Account already exists with this email address" ],
        required: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: [ "user", "admin" ],
        default: "user"
    },

    isBlocked: {
        type: Boolean,
        default: false
    },

    isVerified: {
        type: Boolean,
        default: true
    },

    otp: {
        type: String,
        default: null
    },

    otpExpiry: {
        type: Date,
        default: null
    },

    otpLastSentAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})

const userModel = mongoose.model("User", userSchema)

module.exports = userModel
