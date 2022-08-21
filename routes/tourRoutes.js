const express = require('express');
const router = express.Router();
const {
  getAllTours,
  getTour,
  updateTour,
  createTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,

} = require('../controllers/tourControllers');

const { aliasTopTours, protect, restrictTo } = require('../middleware');

const reviewRouter = require("../routes/reviewRoutes");

// so here we are saying, when router will hit this end point it will use reviewRouter.
// so the thing to note here is when we will be routed to reviewRouter we won't have access to tourId, so to have access to tourId we have to use mergeParams : true, so it will merge the parameters from parent route to the child route
router.use("/:tourId/reviews", reviewRouter);



// PARAM MIDDLEWARE
// router.param("id", checkID);

router.route('/top-5-cheap')
  .get(aliasTopTours, getAllTours);

router.route("/tour-stats")
  .get(getTourStats);

router.route("/monthly-plan/:year")
  .get(protect, restrictTo("admin", "lead-guide", "guide"), getMonthlyPlan);


// this is the one for geo-spatial operations. 
// so the distance will be 250 for example, latitude and longitude for latlng and unit for km or miles. 
router.route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(getToursWithin);

router.route("/distances/:latlng/unit/:unit")
  .get(getDistances);

router.route('/')
  .get(getAllTours)
  .post(protect, restrictTo("admin", "lead-guide"), createTour);

router.route('/:id')
  .get(getTour)
  .patch(protect, restrictTo("admin", "lead-guide"), uploadTourImages, resizeTourImages, updateTour)
  .delete(protect, restrictTo("admin", "lead-guide"), deleteTour);


module.exports = router;
