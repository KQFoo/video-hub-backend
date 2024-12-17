const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("playlist", {
        playlist_id: {
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
        playlist_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        total_videos: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        sequelize,
        tableName: "playlist",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
        ,
        indexes: [
            {
                name: "PRIMARY_PLAYLIST",
                unique: true,
                using: "BTREE",
                fields: [
                    { name: "playlist_id" },
                ]
            },
            {
                name: "p_user_id_fk",
                using: "BTREE",
                fields: [{ name: "user_id" }]
            }
        ]
    });
}