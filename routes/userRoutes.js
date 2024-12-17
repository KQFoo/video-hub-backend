const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

/**
 * @route   GET /user/{user_id}/find-all-playlists
 * @desc    Find all playlists under specific user
 * @params  user_id
 */
// router.get("/:id/find-all-playlists", userController.findAllPlaylists);

/**
 * @route   POST /user/signup
 * @desc    Create a new user
 * @body    username, email, password
 */
router.post("/signup", userController.signup);

/**
 * @route   POST /user/login
 * @desc    Login user
 * @body    email, password
 */
router.post("/login", userController.login);

/**
 * @route   POST /user/find
 * @desc    Find user
 * @body    username, email
 */
router.post("/find", userController.findUser);

/**
 * @route   POST /user/forget-password
 * @desc    Reset Password
 * @body    email, password
 */
router.post("/forget-password", userController.forgetPassword);

module.exports = router;