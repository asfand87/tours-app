const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require("../models/user");
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour must have more or equal than 10 characters'],
      required: [true, 'Tour must have a name'],
      // validate: [validator.isAlpha, 'tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, ' A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group number'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour should have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficult is either : easy, medium, difficult',
      },
    },
    // ratingsAverage is counted average of a tour from reviews.
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10 // 4.666, 46.66666. 47. 4.7 because Math.round will round 4.666 to 4.
    },

    // ratingsQuantity is number is ratings Tour got from it's reviews.
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Tour must have a price'],
    },
    // here we are creating our own validator ************************
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on new document creation so only when creating documents.
          return val < this.price; // either return true or false
        },
        // this value is mongoose method of getting val which is passed in the function
        // so message will only trigger when val > this.price .
        message: 'Discount price({VALUE}) should be below the regular price!',
      },
    },
    summary: {
      type: String,
      // trim only worlds for Strings and its main purpose is to remove the white space at the start and at the end of the string.
      required: [true, 'A tour must have a summary'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    imageCover: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a cover image!'],
    },

    // images will be string of an array and this is how we do it.
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      // so default here is referring to true or false 
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    // embedding locations here.
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      }
    ],
    // referencing guides here.
    guides: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
      }
    ],

    // reviews: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Review",
    //   }
    // ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// so by default _id has index created on this field by mongoDb, so we don't need to create one for it but when we have other queries we have to make indexes for them so the queries can be performed faster.
// so 1 means in ascending order and -1 stands for de-ascending order.
// tourSchema.index({ price: 1 })
// following is compound index.
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// this is for geo-spatial queries. 
tourSchema.index({ startLocation: "2dsphere" })
// after virtual we need to do this step so then the durationWeeks will be visible in the database.
// we have to pass in object as an option to the schema . toJSON:{virtuals: true},
// toObject : {virtuals : true}
// so this is pointing to this document which is tourSchema.
// so basically durationWeeks will be added to the result of every request and can be shown in the object which is coming from the database but it is not persisted, hence called virtual.
// virtual is not a middleware **
tourSchema.virtual('durationWeeks').get(function (next) {
  return this.duration / 7;
});



// this doesn't work for some reason *************************
// this is virtual populate.
//** this virtual will not show up until we will put .populate in tourController in getTour function and have to populate the virtual reviews from there.  */ const tour = await Tour.findById(id).populate("reviews")
// this virtual method will give an array of reviews on a Tour.
tourSchema.virtual("reviews", {
  // ref is the name of the model in our case it's review.
  ref: "Review",


  // Foreign Field is the field name where our id is stored in reviews so in our case it's tour field where we referenced Tour schema
  foreignField: "tour",

  // and localField is where this id is stored, so local basically this model in our case it's Tour mode. and id is _id.
  localField: "_id",

})

// ***************************************************************

// document middle wares ******************
// the following will not work until we will add slug to our schema so please check slug in schema because
// we are adding slug to this. this.slug !!
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// so the post middleware has excess to document and also next.
// tourSchema.post("save", function (doc, next) {
//     console.log(doc);
//     next();
// })

// either can do like this. 
// tourSchema.pre("save", function (next) {
//   const user = this.guides.map(async id => await User.findById(id));
//   user.forEach(async x => {
//     console.log(await x);
//   })
//   next();
// })

//  ** or above can be done like this . this is how embedding works
// tourSchema.pre("save", async function (next) {
//   // this.guides.map will return promises 
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   console.log(this.guides);
//   next();
// })





// document middle wares ****************** end of the middleware its also called  query hook

// ***************** Query middleware ***************************
// next in this function points to the current query.
// will use regular expression
// /^find/ this regular expression means all the things which starts with find so findOne findOneAndUpdate etc.
tourSchema.pre(/^find/, function (next) {
  // tourSchema.pre("find", function(next){
  // this is referring to a queryObject so we can chain all the query methods what we need
  this.find({ secretTour: { $ne: true } });
  // adding start to this object
  this.start = Date.now();
  next();
});


tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt"
  })
  next();
})

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} mili seconds`);
  // console.log(docs);
  next();
});

// ***************** Query middleware Ending ***************************

// ***************** Aggregation Middleware  ************************* **
// tourSchema.pre('aggregate', function (next) {
//   // this has a function in it which is pipleline();
//   // so we push the option to it which we want in our case its secretTour : {$ne:true}
//   // console.log(this.pipeline());
//   // The unshift() method adds one or more elements to the beginning of an array and returns the new length of the array
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   next();
// });

// ***************** Aggregation Middleware Ending  ***************************

module.exports = mongoose.model("Tour", tourSchema);
// ANOTHER WAY OF EXPORTING MODEL
// const Tour = mongoose.model('Tour', tourSchema);
// module.exports = Tour;
