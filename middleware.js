const { catchAsync } = require("./utils/catchAsync");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const { AppError } = require('./utils/appError');
// const tours = JSON.parse(fs.readFileSync('./dev-data/data/tours-simple.json'));
const User = require("./models/user");

// middleware to check id
// this is the middleware for params. so it takes four parameters. val is the req.params
// module.exports.checkID = (req, res, next, val) => {
//     console.log(val);
//     if (req.params.id * 1 > tours.length) {
//         return res.status(404).json({
//             status: "fail",
//             message: "Invalid ID"
//         })
//     }
//     next();
// }



module.exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage, price',
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty',
    next();
};


module.exports.protect = catchAsync(async (req, res, next) => {

  let token;

  // 1) Getting token and check if it's present

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {

    token = req.headers.authorization.split(" ")[1];

  } else if (req.cookies.jwt) {
    token = req.cookies.jwt
  };
  if (!token) {
    return next(new AppError("You are not logged in!, Please log in to get access", 401));
  }
  // 2) Verification the token.
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3) Check if user still exists 
  const freshUser = await User.findOne({ _id: decoded.id });
  // console.log(freshUser);
  if (!freshUser) {
    return next(new AppError("The user belonging to the token no longer exist", 401));
  }
  // 4) Check if user changed password after the token was issued 
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError("User recently changed the password!, Please log in again!", 401));
  };

  // if every thing goes well then grant access to the protected route!!!!

  // adding user to req object
  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});


// is logged in middleware and is only for rendered pages , no errors
module.exports.isLoggedIn = catchAsync(async (req, res, next) => {

  if (req.cookies.jwt === "null") return next();
  // so we have set the jwt in cookies. 
  if (req.cookies.jwt) {
    const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
    // console.log("this is decoded here ", decoded);
    // decoded object contains id , iat and exp.

    // 3) Check if user still exists 
    // decoded object has id in it. which is user id which is stored in a jwt token.
    const currentUser = await User.findOne({ _id: decoded.id });
    // console.log(currentUser);
    if (!currentUser) {
      return next();
    }
    // 4) Check if user changed password afterthe token was issued 
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next();
    };

    // if every thing goes well then grant access to the protected route!!!!

    // There is a logged in user.
    res.locals.user = currentUser;
    // console.log("this is logged in user ", res.locals.user)
    // req.user = currentUser;
    return next();
  };
  // so if there is no cookie then it means no logged in cookie so it will go to the next middleware.
  next()
});

// roles is an array, which can have user , admin, or whatever.
module.exports.restrictTo = (...roles) => {

  return (req, res, next) => {
    // so if the role is not in the array of roles which is admin or lead-guide then throw following error
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You don't have permission to perform this action", 403));
    }
    next();
  }
}

module.exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
}


