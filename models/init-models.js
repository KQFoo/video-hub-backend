var DataTypes = require("sequelize").DataTypes;
var _user = require("./user");
var _video = require("./video");
var _playlist = require("./playlist");

function initModels(sequelize) {
    var user = _user(sequelize, DataTypes);
    var video = _video(sequelize, DataTypes);
    var playlist = _playlist(sequelize, DataTypes);

    // Video Relationship
    video.belongsTo(user, { as: "user", foreignKey: "user_id" });
    video.belongsTo(playlist, { as: "playlist", foreignKey: "playlist_id" });
    user.hasMany(video, { as: "video", foreignKey: "user_id" });
    playlist.hasMany(video, { as: "video", foreignKey: "playlist_id" });

    // Playlist Relationship
    playlist.belongsTo(user, { as: "user", foreignKey: "user_id" });
    user.hasMany(playlist, { as: "playlist", foreignKey: "user_id" });

    return {
        user,
        video,
        playlist
    };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;