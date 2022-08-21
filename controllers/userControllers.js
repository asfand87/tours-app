const User = require("../models/user");
const multer = require("multer");
const sharp = require("sharp");
const { AppError } = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const { getOne, deleteOne, updateOne, getAll } = require("./handlerFactory");



const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        cb(new AppError("Not an image!, Please upload only image files.", 400), false);
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})


const uploadUserPhoto = upload.single("photo");


// actual image resizing. 
const resizeUserPhoto = async (req, res, next) => {
    req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
    if (!req.file) return next();
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);

    next();
}


// this function is to get currently logged user's data. 

const getMe = (req, res, next) => {
    req.params.id = req.user._id;
    // console.log(req.params.id);
    next();
}



// so this update me is for updating currently logged in user where the other updateUser function is for admin to update the users
const updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError("This route is not for password update route. Please use updateMyPassword", 400));
    }
    // 2) Update user document. filter unwanted data.

    // this is not required as I am only taking values which i want from the body in data object
    if (req.body) {
        if (req.body.role) {
            return next(new AppError("Unauthorized to set up roles!", 404));
        }
    }
    const data = {
        name: req.body.name || req.user.name,
        email: req.body.email || req.user.email,
    }
    // console.log(data);

    if (data.password) {
        return new AppError("This route is not for password update route. Please use updateMyPassword route", 400)
    };
    // 3) update the user.
    if (req.file) data.photo = req.file.filename;


    const updatedUser = await User.findByIdAndUpdate(req.user._id, data, { new: true, runValidators: true });
    // for testing purpose
    //     console.log(updatedUser);

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser
        }
    })
})

const deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(204).json({
        status: "success",
        data: null,
    });
})
// get all users 
const getAllUsers = getAll(User);


const getUser = getOne(User);

const createUser = (req, res, next) => {
    res.status(500).json({
        status: "error",
        message: "This route is not yet defined! Please use Sign up instead",
    })
}


const updateUser = updateOne(User);
const deleteUser = deleteOne(User);


module.exports = {
    getAllUsers, getUser, updateUser, deleteUser, createUser, updateMe, deleteMe, getMe, uploadUserPhoto, resizeUserPhoto
}