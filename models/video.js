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
        v_random_id: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        video_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        link: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        video_path: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        views: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        last_watched: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        downloaded: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        thumbnail: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        cloud_url: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        cloud_public_id: {
            type: DataTypes.STRING(255),
            allowNull: true
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
                name: "PRIMARY_VIDEO",
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
            }
        ]
    });
}