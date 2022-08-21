const crypto = require("crypto");
const User = require("../models/user.js");
const { catchAsync } = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const { AppError } = require("../utils/appError");
const Email = require("../utils/email");

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        // secure: true,
        httpOnly: true,
    };
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
    res.cookie("jwt", token, cookieOptions);

    // to hide the password from the json when we create user do the following. 
    // user is passed as an argument in the function (user, statusCode, res)
    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user: user,
        }
    })
}


const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}

module.exports.signup = catchAsync(async (req, res, next) => {
    const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt, // date.now();
        role: req.body.role,
    });

    await newUser.save();
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, res);
});

module.exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    // 1) Check if the email and password exist 
    if (!email || !password) {
        return next(new AppError("Please provide email and password!", 400));
    }
    // 2) Check if the user exists && password is correct
    // we are saying that show the password because in schema password field is select to false.
    const user = await User.findOne({ email: email }).select("+password");
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("Incorrect Email or Password!"), 401);
    }
    // 3) If every thing is ok, send token to client.
    createSendToken(user, 200, res);

});
module.exports.logOut = catchAsync(async (req, res, next) => {
    res.cookie("jwt", "null", {
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    res.status(200).json({
        status: "success"
    })
});

module.exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get User based on Posted Email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError("There is no user with this email address!", 404));
    }
    // 2) then generate random token.
    const resetToken = await user.createPasswordResetToken();
    // we are saying that don't validate schema on save.
    await user.save({ validateBeforeSave: false });
    // 3) Send it to user's email.
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;
    try {

        await new Email(user, resetURL).sendPasswordReset();
        res.status(200).json({
            status: "Success",
            message: "Token send to email!",
        })
    } catch (err) {
        // if (err) console.log(err);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("there was an error sending the email, Try again later please."), 500);
    }
})

module.exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    // We compare the hashed token which is saved on the user object.
    const user = await User.findOne({ passwordResetToken: hashedToken });
    // console.log(user);
    // 2) If token is not expired and there is a user, set the new password
    if (!user) {
        return next(new AppError("Token is invalid or has expired!"), 400);
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Can do it here, but we did it in user model before saving.
    // user.passwordChangedAt = Date.now();
    await user.save()
    // 3) Update changedPasswordAt property for the user
    // HAVE DONE IT IN USER MODEL.
    // 4) Log the user in, send JWT to the client.
    createSendToken(user, 200, res);

})

module.exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get the user from the collection.
    const user = await User.findById(req.user._id).select("+password");
    // 2) Check if posted current password is correct
    if (! await user.correctPassword(req.body.passwordCurrent, user.password)) {
        return next(new AppError("Password you entered is not correct!", 401));
    }
    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // 4) Log user in, send JWT 
    createSendToken(user, 200, res);
})



