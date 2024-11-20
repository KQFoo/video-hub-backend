const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("history", {
        history_id: {
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
                key: "user_id"
            }
        },
        // video_id: {
        //     type: DataTypes.INTEGER,
        //     allowNull: false,
        //     references: {
        //         model: "video",
        //         key: "video_id"
        //     }
        // },
        // playlist_id: {
        //     type: DataTypes.INTEGER,
        //     allowNull: false,
        //     references: {
        //         model: "playlist",
        //         key: "playlist_id"
        //     }
        // },
        watched_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        tableName: "history",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        indexes: [
            {
                name: "PRIMARY",
                uniqie: true,
                using: "BTREE",
                fields: [{
                    name: "history_id"
                }]
            },
            {
                name: "h_user_id_fk",
                using: "BTREE",
                fields: [{ name: "user_id" }]
            },
            // {
            //     name: "h_video_id_fk",
            //     using: "BTREE",
            //     fields: [{ name: "video_id" }]
            // },
            // {
            //     name: "h_playlist_id_fk",
            //     using: "BTREE",
            //     fields: [{ name: "playlist_id" }]
            // }
        ]
    });
}