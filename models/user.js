const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongooseRaw = require("passport-local-mongoose");
const passportLocalMongoose = passportLocalMongooseRaw.default || passportLocalMongooseRaw;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        default: ""
    },
    resetPasswordToken: {
        type: String,
        default: undefined
    },
    resetPasswordExpires: {
        type: Date,
        default: undefined
    },
    cart: [
        {
            type: Schema.Types.ObjectId,
            ref: "Listing"
        }
    ],
    bookings: [
        {
            listing: {
                type: Schema.Types.ObjectId,
                ref: "Listing"
            },
            bookingCode: String,
            checkIn: String,
            checkOut: String,
            guests: Number,
            phone: String,
            totalPrice: Number,
            bookedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
