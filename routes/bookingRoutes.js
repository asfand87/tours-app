const express = require("express");
const router = express.Router();
const { checkoutSession, createBooking, getBooking, getAllBookings, updateBooking, deleteBooking } = require("../controllers/bookingController");
const { protect, restrictTo, setTourUserIds } = require("../middleware");



router.use(protect);

router.route("/checkout-session/:tourID")

  .get(checkoutSession);
router.route("/")
  .get(getAllBookings);

router.use(restrictTo("admin", "lead-guide"))

router.route("/")
  .get(getAllBookings)
  .post(createBooking)


router.route("/:id")
  .get(getBooking)
  .patch(updateBooking)
  .delete(deleteBooking);


module.exports = router;