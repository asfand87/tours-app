const express = require("express");

const router = express.Router();
const { getOverview, getTour, getLogin, getAccount, updateUserData, getMyTours } = require("../controllers/viewsController");
// const { createBookingCheckout } = require("../controllers/bookingController");
const { isLoggedIn, protect } = require("../middleware");




router.get("/", isLoggedIn, getOverview);
// DETAIL PAGE. 
router.get("/tours/:slug", isLoggedIn, getTour);
// LOGIN Route. 
router.get("/login", isLoggedIn, getLogin);
// Me route 
router.get("/Me", protect, getAccount);

router.get("/My-Tours", protect, getMyTours);

router.post("/submit-user-data", protect, updateUserData);


module.exports = router;
