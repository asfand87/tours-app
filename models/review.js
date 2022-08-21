const mongoose = require("mongoose");
const Tour = require("../models/tours");
const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, "Review Can't be empty"],
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: "Tour",
            required: [true, "Review must belong to a tour"]
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: [true, "Review must belong to a user!"]
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);


// if we set index for tour and user then it will take only unique tour and index means that user can only give one review per Tour after we say unique is true for them.
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });





reviewSchema.pre(/^find/, function (next) {
    // this.populate({
    //     path: "tour",
    //     select: "name"
    // }).populate({
    //     path: "user",
    //     select: "name photo"
    // })

    this.populate({
        path: "user",
        select: "name photo"
    })
    next();
});

// Static function. 
// so statics methods can be called on model directly. like Review.calcAverageRatings; await doc.constructor.calcAverageRatings(doc.tour); line 95
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    // this points to the model. review model;
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                // $tour and $rating is the field name in model.
                _id: "$tour",
                // nRating is number of rating  
                nRating: { $sum: 1 },
                avgRating: { $avg: "$rating" }
            }
        }

    ]);

    // console.log(stats)
    // [ { _id: 61216c6c99b4ad0d88f2aebc, nRating: 1, avgRating: 5 } ] this is how its stored

    await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating,
    })
};


// this is after we create a review hence post and also post middleware doesn't have access to next()
reviewSchema.post("save", async function (doc) {
    // console.log("this is the document!", doc);
    // this points to the model 
    // this.tour is the field in this review model . so like Review.tour as this field only stores id.
    // this.constructor.calcAverageRatings(this.tour);
    await doc.constructor.calcAverageRatings(doc.tour);
})

// we can also use only one middleware like .post(/save|findOne/)

//findByIdAndUpdate
//findByIdAndUpdate both these queries are behind the scene findOneAndUpdate or findOneAndDelete
// this is when ever some one try to update or delete then we calculate reviews and update them accordingly.
// we want this to run every time a review is updated or deleted
reviewSchema.post(/^findOneAnd/, async (doc) => {
    await doc.constructor.calcAverageRatings(doc.tour);
})


const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;