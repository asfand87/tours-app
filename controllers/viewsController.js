const { catchAsync } = require("../utils/catchAsync");
const Tour = require("../models/tours");
const User = require("../models/user");
const Booking = require("../models/booking");
const { AppError } = require("../utils/appError")


module.exports.getOverview = catchAsync(async (req, res, next) => {
    const tours = await Tour.find();
    // 1) get all the tours
    // 2) Build Template 
    // 3) Render that template using tour data.
    res.status(200)
        .render("../views/overview", {
            title: "All Tours",
            tours
        });
});

module.exports.getTour = catchAsync(async (req, res, next) => {
    const { slug } = req.params;
    const tour = await Tour.findOne({ slug: slug }).populate({
        path: "reviews",
        select: "review rating user"
    })
    if (!tour) {
        return next(new AppError("There is no Tour with that name", 404));
    }
    res.status(200)
        .render("../views/tour.pug", {
            title: `${tour.name} Tour`,
            tour
        });
});



module.exports.getLogin = catchAsync(async (req, res, next) => {
    res.status(200)
        .render("../views/_login.pug", {
            title: "Login in to your account"
        });
});



// so for the following protect middleware was used and that's why i m not querying the database for user, as there i have put req.user = current user so once that will run req object will have user on it.
module.exports.getAccount = catchAsync(async (req, res, next) => {
    res.status(200)
        .render("account", {
            title: "Tour account",
        });
});

module.exports.updateUserData = async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user._id, {
        name: req.body.name,
        email: req.body.email,
    },
        {
            new: true,
            runValidators: false,
        });
    // we will pass updatedUser to the template so that it will display updated User.
    res.status(200).render("account", {
        title: "Your account",
        user: updatedUser
    });

};

module.exports.getMyTours = async (req, res, next) => {
    // 1) find all bookings
    const booking = await Booking.find({ user: req.user.id })

    // 2) find tours with the returned IDS array
    const tourIDs = booking.map(el => el.tour);
    // where _ID matches tourIDs array.
    const tours = await Tour.find({ _id: { $in: tourIDs } });

    res.status(200).render("overview", {
        title: "My Tours",
        tours
    })
}