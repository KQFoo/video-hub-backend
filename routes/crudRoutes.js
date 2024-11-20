const express = require("express");
const crudController = require("../controllers/crudController");

function generateCrudRoutes(Model) {
    const router = express.Router();

    // Standard CRUD routes
    router.post("/create", crudController.create(Model)); // Create one

    router.get("/find/:id", crudController.find(Model)) // Find one
    router.get("/findall", crudController.findAll(Model)); // Find all

    //router.put("/update/:id", crudController.update(Model)); // Update one

    router.delete("/delete/:id", crudController.delete(Model)); // Delete one

    return router;
}

module.exports = generateCrudRoutes;