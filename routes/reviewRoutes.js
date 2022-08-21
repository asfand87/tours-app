const express = require("express");
const { protect, restrictTo, setTourUserIds } = require("../middleware");

const { getAllReviews, createReview, deleteReview, updateReview, getReview } = require("../controllers/reviewController");


const router = express.Router({ mergeParams: true });

// all the reviews are protected!!!
router.use(protect);

router.route("/")
    .get(getAllReviews)
    .post(restrictTo("user"), setTourUserIds, createReview);


// so guides can not create update or delete reviews, as they are the ones doing the job.
router.route("/:id")
    .get(getReview)
    .patch(restrictTo("user", "admin"), updateReview)
    .delete(restrictTo("user", "admin"), deleteReview);

module.exports = router;