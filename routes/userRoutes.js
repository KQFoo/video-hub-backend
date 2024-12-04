const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

/**
 * @route   GET /user/{user_id}/find-all-playlists
 * @desc    Find all playlists under specific user
 * @params  user_id
 */
router.get("/:id/find-all-playlists", userController.findAllPlaylists);

module.exports = router;