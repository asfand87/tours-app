// middleware for catching errors in async functions.
// passing function as a parameter.
module.exports.catchAsync = fn => {
    // then we are returning function which takes req, res, next as an parameter.
    return (req, res, next) => {
        // then we call fn because its a function and then we pass req, res and next in to it
        // and as fn is async function so it will return promise thats why we chain catch with it and pass err to next middleware
        fn(req, res, next).catch(err => next(err));
    }

}
