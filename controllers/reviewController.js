const Review = require('../models/review');
// const Tour = require("../models/tours");
// const { catchAsync } = require("../utils/catchAsync");
// const { AppError } = require("../utils/appError");
const { createOne, deleteOne, updateOne, getOne, getAll } = require("./handlerFactory");


// this is for getting all the reviews on one Tour.
const getAllReviews = getAll(Review);
const getReview = getOne(Review);
const createReview = createOne(Review);
const updateReview = updateOne(Review);
const deleteReview = deleteOne(Review);

module.exports = {
    getAllReviews, createReview, deleteReview, updateReview, getReview
}
