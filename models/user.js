const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    // name: {
    //     type: String,
    //     required: true,
    // },
    fname: {
        type: String,
        required: true,
    },
    lname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    cpassword: {
        type: String,
        required: true,
    },
    selectedUserType: {
        type: String,
        required: true,
    },
    detailStatus: {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String
    },
    otp: {
        type: Number,
    },
    addresses: [
        {
            name: String,
            mobileNo: String,
            houseNo: String,
            street: String,
            landmark: String,
            city: String,
            country: String,
            postalCode: String,
        }
    ],
    orders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order"
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

const User = mongoose.model("User", userSchema);

module.exports = User;