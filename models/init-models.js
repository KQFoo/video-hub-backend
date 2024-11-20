var DataTypes = require("sequelize").DataTypes;
var _user = require("./user");
var _video = require("./video");
var _playlist = require("./playlist");
var _history = require("./history");

function initModels(sequelize) {
    var user = _user(sequelize, DataTypes);
    var video = _video(sequelize, DataTypes);
    var playlist = _playlist(sequelize, DataTypes);
    var history = _history(sequelize, DataTypes);

    // Video Relationship
    video.belongsTo(user, { as: "user", foreignKey: "user_id" });
    video.belongsTo(playlist, { as: "playlist", foreignKey: "playlist_id" });
    video.belongsTo(history, { as: "history", foreignKey: "history_id" });
    user.hasMany(video, { as: "video", foreignKey: "user_id" });
    playlist.hasMany(video, { as: "video", foreignKey: "playlist_id" });
    history.hasMany(video, { as: "video", foreignKey: "history_id" });

    // Playlist Relationship
    playlist.belongsTo(user, { as: "user", foreignKey: "user_id" });
    user.hasMany(playlist, { as: "playlist", foreignKey: "user_id" });

    // History Relationship
    history.belongsTo(user, { as: "user", foreignKey: "user_id" });
    user.hasOne(history, { as: "history", foreignKey: "user_id" });

    return {
        user,
        video,
        playlist,
        history
    };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;