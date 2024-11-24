const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

/**
 * @description find all playlists under specific user
 * @url /user/{user_id}/find-all-playlists
 */
router.get("/:id/find-all-playlists", userController.findAllPlaylists);

module.exports = router;