const express = require("express");
const router = express.Router();
const { getAllUsers, createUser, getUser, updateUser, deleteUser, updateMe, deleteMe, getMe, uploadUserPhoto, resizeUserPhoto } = require("../controllers/userControllers");
const { signup, login, logOut, forgotPassword, resetPassword, updatePassword } = require("../controllers/authController");
const { protect, restrictTo } = require("../middleware");



router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logOut);

router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);


// so if we do like this, it will act as middleware on all the routes but not on the above routes as we are only defining it here.
router.use(protect);

router.patch("/updateMyPassword", updatePassword)

// so in the getMe route we will have it protected then with getMe function we are setting user id and then we search with getOne function.
router.get("/me", getMe, getUser);

// router.patch("/updateMe", upload.single("photo"), updateMe);
router.patch("/updateMe", uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete("/deleteMe", deleteMe);



router.use(restrictTo("admin"));
router.route("/")
    .get(getAllUsers)
    .post(createUser);

router.route("/:id")
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);


module.exports = router;