const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("video", {
        video_id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "user",
                key: "user_id",
            },
        },
        playlist_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "playlist",
                key: "playlist_id",
            },
        },
        history_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "history",
                key: "history_id",
            },
        },
        video_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        link: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        play_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        added_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        last_watched: {
            type: DataTypes.DATE,
            allowNull: false
        },
        downloaded: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        }
    }, {
        sequelize,
        tableName: "video",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
        ,
        indexes: [
            {
                name: "PRIMARY",
                unique: true,
                using: "BTREE",
                fields: [
                    { name: "video_id" },
                ]
            },
            {
                name: "v_user_id_fk",
                using: "BTREE",
                fields: [{ name: "user_id" }]
            },
            {
                name: "v_playlist_id_fk",
                using: "BTREE",
                fields: [{ name: "playlist_id" }]
            },
            {
                name: "v_history_id_fk",
                using: "BTREE",
                fields: [{ name: "history_id" }]
            }
        ]
    });
}