const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("user", {
        user_id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        user_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        hashed_password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        salt: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    }, {
        sequelize,
        tableName: "user",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at"
        ,
        indexes: [
            {
                name: "PRIMARY_USER",
                unique: true,
                using: "BTREE",
                fields: [
                    { name: "user_id" },
                ]
            }
        ]
    });
}