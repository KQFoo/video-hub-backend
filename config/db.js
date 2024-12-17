const { Sequelize } = require("sequelize");
const initModels = require("../models/init-models");
require("dotenv").config();

const dbPassword = process.env.DB_PASS ? encodeURIComponent(process.env.DB_PASS.trim()) : '';

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    dbPassword,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        port: process.env.DB_PORT,
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
);

const models = initModels(sequelize);

sequelize
    .authenticate()
    .then(() => console.log("Database connected..."))
    .catch((err) => console.log("Error: " + err));

const syncDatabase = async () => {
    try {
        // Temporarily disable foreign key checks in the database
        // await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

        // Synchronize the models with the database schema
        await sequelize.sync({ alter: true });

        // Re-enable foreign key checks in the database
        // await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

        console.log("Database sync complete.");
    } catch (err) {
        console.log("Sync error: " + err);
    }
};

syncDatabase();

module.exports = { sequelize, models };