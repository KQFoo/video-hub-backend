const db = require('../config/db');
const { playlist, user } = db.models;

const userController = {
    findAllPlaylists: async (req, res) => {
        try {
            const user_id = req.params.id;

            const _user = await user.findByPk(user_id);

            // Check if user exists or not
            if (!_user) {
                return res.status(400).json({ message: "User not found" });
            }

            const playlists = await playlist.findAll({ where: { user_id: user_id } });

            if (playlists.length === 0) {
                return res.status(404).json({ message: "No playlists were found" });
            }

            res.status(200).json(playlists);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = userController; 