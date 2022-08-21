// const fs = require('fs');
// const tours = JSON.parse(fs.readFileSync("./dev-data/data/tours-simple.json"));

const multer = require("multer");
const sharp = require("sharp");
const Tour = require('../models/tours');
// const APIFeatures = require('../utils/apiFeatures');
const { catchAsync } = require("../utils/catchAsync");
const { AppError } = require("../utils/appError");
const { getOne, getAll, createOne, deleteOne, updateOne } = require("./handlerFactory");

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
});


const uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 }
]);


const resizeTourImages = async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) next();

  // // 1) Cover Image 
  // Adding imageCover to body because updateOne factory function expects req.body to update tour.
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);


  // 2)
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(4000, 3000)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  )

  next();
}

const getAllTours = getAll(Tour);


const createTour = createOne(Tour);
const getTour = getOne(Tour, { path: "reviews" });

// Update tour.
const updateTour = updateOne(Tour);

// After factory function.
const deleteTour = deleteOne(Tour);

const getTourStats = catchAsync(async (req, res, next) => {

  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    {
      // so the following query says match the documents where id is not equals to Easy so basically exclude it.
      $match: { _id: { $ne: 'EASY' } },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });

});

const getMonthlyPlan = catchAsync(async (req, res, next) => {

  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      // unwind is used to de-structure an array 
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        // so this push is making a tour name array
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      // project is used to include or exclude fields, so 0 will exclude fields and 1 will include fields
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    // this is to limit similar to query.
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    data: {
      plan,
    },
  });

});



// this is the controller for geo-spatial operations. 
const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  // so split will give us an array, so we can then de-structure it and get lat and lang can name whatever we want
  const [lat, lng] = latlng.split(",");

  // if it's in miles or in kilometers 
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(new AppError("Please provide latitude and longitude in the format lat, lng.", 400));
  };

  // so we will query for start location as it holds geo locations in it. 
  // %geoWithin is geo-spatial operator .
  // so order does matter first longitude then latitude. 
  const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } })

  res.status(200).json({
    status: "success",
    results: tours.length,
    //in order  to do the geo-spatial queries we have to add an index in our Tour model on the field where goe-spatial data is stored in our case it's start location. 
    data: {
      data: tours
    }
  })
})


const getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  // so split will give us an array, so we can then de-structure it and get lat and lang can name whatever we want
  const [lat, lng] = latlng.split(",");

  // results will be in meters or in miles thats why we are doing this conversion here!
  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(new AppError("Please provide latitude and longitude in the format lat, lng.", 400));
  };


  const distances = await Tour.aggregate([
    // for geo-spatial we have only one stage which is called $geoNear and it must uses index which contains geo-spatial data.
    // distanceMultiplier is mongodb property which is multiplied with all the distance field which we will get after the query.
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: "distance",
        distanceMultiplier: multiplier,
      }
    },
    {
      $project: {
        distance: 1,
        name: 1,
      }
    }
  ]);
  res.status(200).json({
    status: "success",
    //in order  to do the geo-spatial queries we have to add an index in our Tour model on the field where goe-spatial data is stored in our case it's start location. 
    data: {
      data: distances
    }
  })

})

module.exports = {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages
};
