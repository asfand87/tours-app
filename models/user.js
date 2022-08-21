const crypto = require("crypto"); // its built in .

const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: [true, "Please tell us your name"]
    },
    email: {
        type: String,
        required: [true, "Please provide email address"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide valid email!"],
    },
    photo: {
        type: String,
        default: "default.jpg"
    },
    role: {
        type: String,
        enum: {
            values: ["user", "guide", "lead-guide", "admin"],
            message: "only values allowed are user, guide, lead-guide and amin.",
        },
        default: "user",
    },
    password: {
        type: String,
        required: [true, "Please provide password"],
        minLength: 8,
        select: false

    },

    passwordConfirm: {
        type: String,
        required: [true, "Please provide required password!"],
        validate: {
            // this only works on create and save
            validator: function (el) {
                return el === this.password;
            },
            message: "Passwords are not the same!!"
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

userSchema.pre("save", async function (next) {
    // if the password is not modified 
    if (!this.isModified("password")) return next();

    // and if the password is modified then do this 
    this.password = await bcrypt.hash(this.password, 12);
    // so after we hash the password we will delete the confirm password from the DB as we just needed it for validation purposes. 
    this.passwordConfirm = undefined;
    next();

});

userSchema.pre("save", function (next) {
    // so this.isNew is mongoose method which checks if the document is new .
    // and if the password is not modified and the document is new. then passwordChangedAt = date.now
    // so have to understand that modified in this context means if the password is not updated.
    if (!this.isModified("password") || this.isNew) return next();
    this.passwordChangedAt = Date.now();
    // this.passwordChangedAt = Date.now() - 1000 ;  this is if the code doesn't work as some times the token is created earlier.
    next();
})


userSchema.pre(/^find/, function (next) {
    // this points to the current query 
    // this middle ware works with find.
    // this points to the current query, in our case we have used it in delete user which then triggers the user.find() and we only then want the documents where user have active property set to true on them.
    this.find({ active: { $ne: false } });
    next();
})


// making instance method, this method will be available on all the instances of user 
// so candidate password is the one which is coming from body and userPassword comes from the database. 
userSchema.methods.correctPassword = async (candidatePassword, userPassword) => {
    // this point to current document.
    return await bcrypt.compare(candidatePassword, userPassword);
};



// this function is to check if the user has changed the password after getting the token when they have signed in.
userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        // const changedTimeStamp = new Date(this.passwordChangedAt / 1000)
        // const timeStamp = new Date(JWTTimeStamp);

        // console.log(changedTimeStamp.toLocaleTimeString());
        // console.log(timeStamp.toLocaleTimeString());

        // Other way of writing the above logic
        // getTime converts the passwordChangedAt to date in miliseconds
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000);
        return JWTTimeStamp < changedTimeStamp; // return 1000 < 2000 true.
    }
    return false;
}


userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    // thing to notice here is that update(resetToken) will not update the resetToken, it will just create new hash for it. this is why we encrypt req.params when we will be resetting the password.
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    // console.log((resetToken), "coming from instance method of user.js createPasswordResetToken ", (this.passwordResetToken));
    return resetToken;
}

const User = mongoose.model("User", userSchema);
module.exports = User;